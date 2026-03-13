package postgres

import (
	"context"
	"strings"
	"time"

	"marketplace-backend/internal/mailer"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EmailJobRepository struct {
	db *pgxpool.Pool
}

func NewEmailJobRepository(db *pgxpool.Pool) *EmailJobRepository {
	return &EmailJobRepository{db: db}
}

func (r *EmailJobRepository) Enqueue(ctx context.Context, message mailer.Message, maxAttempts int) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO email_jobs (
			recipient,
			sender,
			subject,
			body_text,
			max_attempts,
			available_at
		)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, strings.TrimSpace(message.To), strings.TrimSpace(message.From), strings.TrimSpace(message.Subject), message.Text, maxAttempts)
	return mapError(err)
}

func (r *EmailJobRepository) ClaimPending(ctx context.Context, now time.Time, limit int) ([]mailer.Job, error) {
	rows, err := r.db.Query(ctx, `
		WITH claimed AS (
			SELECT id
			FROM email_jobs
			WHERE status = 'pending'
			  AND available_at <= $1
			ORDER BY available_at ASC, created_at ASC
			LIMIT $2
			FOR UPDATE SKIP LOCKED
		)
		UPDATE email_jobs ej
		SET
			status = 'processing',
			locked_at = $1,
			attempts = ej.attempts + 1
		FROM claimed
		WHERE ej.id = claimed.id
		RETURNING
			ej.id,
			ej.recipient,
			ej.sender,
			ej.subject,
			ej.body_text,
			ej.status,
			ej.attempts,
			ej.max_attempts,
			ej.available_at,
			ej.locked_at,
			COALESCE(ej.last_error, ''),
			ej.sent_at,
			ej.created_at,
			ej.updated_at
	`, now, limit)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	jobs := make([]mailer.Job, 0, limit)
	for rows.Next() {
		var job mailer.Job
		if err := scanEmailJob(rows, &job); err != nil {
			return nil, mapError(err)
		}
		jobs = append(jobs, job)
	}
	if err := rows.Err(); err != nil {
		return nil, mapError(err)
	}
	return jobs, nil
}

func (r *EmailJobRepository) MarkSent(ctx context.Context, id uuid.UUID, sentAt time.Time) error {
	_, err := r.db.Exec(ctx, `
		UPDATE email_jobs
		SET
			status = 'sent',
			locked_at = NULL,
			last_error = NULL,
			sent_at = $2,
			available_at = $2
		WHERE id = $1
	`, id, sentAt)
	return mapError(err)
}

func (r *EmailJobRepository) MarkRetry(ctx context.Context, id uuid.UUID, nextAttempt time.Time, lastError string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE email_jobs
		SET
			status = 'pending',
			locked_at = NULL,
			last_error = $3,
			available_at = $2
		WHERE id = $1
	`, id, nextAttempt, truncateText(lastError, 1000))
	return mapError(err)
}

func (r *EmailJobRepository) MarkFailed(ctx context.Context, id uuid.UUID, failedAt time.Time, lastError string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE email_jobs
		SET
			status = 'failed',
			locked_at = NULL,
			last_error = $3,
			available_at = $2
		WHERE id = $1
	`, id, failedAt, truncateText(lastError, 1000))
	return mapError(err)
}

func (r *EmailJobRepository) RequeueStaleProcessing(ctx context.Context, staleBefore time.Time) (int64, error) {
	cmd, err := r.db.Exec(ctx, `
		UPDATE email_jobs
		SET
			status = 'pending',
			locked_at = NULL
		WHERE status = 'processing'
		  AND locked_at IS NOT NULL
		  AND locked_at < $1
	`, staleBefore)
	if err != nil {
		return 0, mapError(err)
	}
	return cmd.RowsAffected(), nil
}

func (r *EmailJobRepository) CleanupFinished(ctx context.Context, finishedBefore time.Time) (int64, error) {
	cmd, err := r.db.Exec(ctx, `
		DELETE FROM email_jobs
		WHERE status IN ('sent', 'failed')
		  AND COALESCE(sent_at, updated_at) < $1
	`, finishedBefore)
	if err != nil {
		return 0, mapError(err)
	}
	return cmd.RowsAffected(), nil
}

func scanEmailJob(row pgx.Row, job *mailer.Job) error {
	return row.Scan(
		&job.ID,
		&job.To,
		&job.From,
		&job.Subject,
		&job.Text,
		&job.Status,
		&job.Attempts,
		&job.MaxAttempts,
		&job.AvailableAt,
		&job.LockedAt,
		&job.LastError,
		&job.SentAt,
		&job.CreatedAt,
		&job.UpdatedAt,
	)
}
