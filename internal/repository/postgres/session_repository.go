package postgres

import (
	"context"
	"fmt"
	"time"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/usecase"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SessionRepository struct {
	db *pgxpool.Pool
}

func NewSessionRepository(db *pgxpool.Pool) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(ctx context.Context, input usecase.CreateSessionInput) (domain.UserSession, error) {
	const q = `
		INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, refresh_token_hash, COALESCE(user_agent, ''), COALESCE(ip::text, ''), created_at, expires_at, revoked_at, rotated_at
	`

	var session domain.UserSession
	err := r.db.QueryRow(ctx, q, input.UserID, input.RefreshTokenHash, nullIfEmpty(input.UserAgent), nullIfEmpty(input.IP), input.ExpiresAt).Scan(
		&session.ID,
		&session.UserID,
		&session.RefreshTokenHash,
		&session.UserAgent,
		&session.IP,
		&session.CreatedAt,
		&session.ExpiresAt,
		&session.RevokedAt,
		&session.RotatedAt,
	)
	if err != nil {
		return domain.UserSession{}, mapError(err)
	}
	return session, nil
}

func (r *SessionRepository) GetByRefreshTokenHash(ctx context.Context, tokenHash string) (domain.UserSession, error) {
	const q = `
		SELECT id, user_id, refresh_token_hash, COALESCE(user_agent, ''), COALESCE(ip::text, ''), created_at, expires_at, revoked_at, rotated_at
		FROM user_sessions
		WHERE refresh_token_hash = $1
	`

	var session domain.UserSession
	err := r.db.QueryRow(ctx, q, tokenHash).Scan(
		&session.ID,
		&session.UserID,
		&session.RefreshTokenHash,
		&session.UserAgent,
		&session.IP,
		&session.CreatedAt,
		&session.ExpiresAt,
		&session.RevokedAt,
		&session.RotatedAt,
	)
	if err != nil {
		return domain.UserSession{}, mapError(err)
	}
	return session, nil
}

func (r *SessionRepository) Rotate(
	ctx context.Context,
	oldSessionID uuid.UUID,
	oldTokenHash string,
	rotatedAt time.Time,
	newSession usecase.CreateSessionInput,
) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin session rotation transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	cmd, err := tx.Exec(ctx, `
		UPDATE user_sessions
		SET rotated_at = $3
		WHERE id = $1 AND refresh_token_hash = $2 AND revoked_at IS NULL AND rotated_at IS NULL
	`, oldSessionID, oldTokenHash, rotatedAt)
	if err != nil {
		return mapError(err)
	}
	if cmd.RowsAffected() == 0 {
		return domain.ErrTokenReused
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip, expires_at)
		VALUES ($1, $2, $3, $4, $5)
	`, newSession.UserID, newSession.RefreshTokenHash, nullIfEmpty(newSession.UserAgent), nullIfEmpty(newSession.IP), newSession.ExpiresAt)
	if err != nil {
		return mapError(err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit session rotation transaction: %w", err)
	}
	return nil
}

func (r *SessionRepository) RevokeByRefreshTokenHash(
	ctx context.Context,
	userID uuid.UUID,
	tokenHash string,
	revokedAt time.Time,
) (bool, error) {
	cmd, err := r.db.Exec(ctx, `
		UPDATE user_sessions
		SET revoked_at = $3
		WHERE user_id = $1 AND refresh_token_hash = $2 AND revoked_at IS NULL
	`, userID, tokenHash, revokedAt)
	if err != nil {
		return false, mapError(err)
	}
	return cmd.RowsAffected() > 0, nil
}

func (r *SessionRepository) RevokeAllByUserID(ctx context.Context, userID uuid.UUID, revokedAt time.Time) error {
	_, err := r.db.Exec(ctx, `
		UPDATE user_sessions
		SET revoked_at = $2
		WHERE user_id = $1 AND revoked_at IS NULL
	`, userID, revokedAt)
	return mapError(err)
}

func nullIfEmpty(value string) any {
	if value == "" {
		return nil
	}
	return value
}
