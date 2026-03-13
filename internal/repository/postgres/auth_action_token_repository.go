package postgres

import (
	"context"
	"time"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthActionTokenRepository struct {
	db *pgxpool.Pool
}

func NewAuthActionTokenRepository(db *pgxpool.Pool) *AuthActionTokenRepository {
	return &AuthActionTokenRepository{db: db}
}

func (r *AuthActionTokenRepository) Create(ctx context.Context, token domain.AuthActionToken) (domain.AuthActionToken, error) {
	const q = `
		INSERT INTO user_action_tokens (id, user_id, purpose, token_hash, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, purpose, token_hash, expires_at, created_at, consumed_at
	`

	var item domain.AuthActionToken
	err := scanAuthActionToken(r.db.QueryRow(ctx, q, token.ID, token.UserID, token.Purpose, token.TokenHash, token.ExpiresAt), &item)
	if err != nil {
		return domain.AuthActionToken{}, mapError(err)
	}
	return item, nil
}

func (r *AuthActionTokenRepository) GetActiveByHash(
	ctx context.Context,
	purpose domain.AuthActionPurpose,
	tokenHash string,
	now time.Time,
) (domain.AuthActionToken, error) {
	const q = `
		SELECT id, user_id, purpose, token_hash, expires_at, created_at, consumed_at
		FROM user_action_tokens
		WHERE purpose = $1 AND token_hash = $2 AND consumed_at IS NULL AND expires_at > $3
	`

	var item domain.AuthActionToken
	err := scanAuthActionToken(r.db.QueryRow(ctx, q, purpose, tokenHash, now), &item)
	if err != nil {
		return domain.AuthActionToken{}, mapError(err)
	}
	return item, nil
}

func (r *AuthActionTokenRepository) Consume(ctx context.Context, id uuid.UUID, consumedAt time.Time) (bool, error) {
	cmd, err := r.db.Exec(ctx, `
		UPDATE user_action_tokens
		SET consumed_at = $2
		WHERE id = $1 AND consumed_at IS NULL
	`, id, consumedAt)
	if err != nil {
		return false, mapError(err)
	}
	return cmd.RowsAffected() > 0, nil
}

func (r *AuthActionTokenRepository) DeleteActiveByUserAndPurpose(
	ctx context.Context,
	userID uuid.UUID,
	purpose domain.AuthActionPurpose,
) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM user_action_tokens
		WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL
	`, userID, purpose)
	return mapError(err)
}

func (r *AuthActionTokenRepository) CleanupExpiredAndConsumed(ctx context.Context, now time.Time) (int64, error) {
	cmd, err := r.db.Exec(ctx, `
		DELETE FROM user_action_tokens
		WHERE expires_at < $1
		   OR (consumed_at IS NOT NULL AND consumed_at < $1 - INTERVAL '24 hours')
	`, now)
	if err != nil {
		return 0, mapError(err)
	}
	return cmd.RowsAffected(), nil
}

func scanAuthActionToken(row pgx.Row, token *domain.AuthActionToken) error {
	return row.Scan(
		&token.ID,
		&token.UserID,
		&token.Purpose,
		&token.TokenHash,
		&token.ExpiresAt,
		&token.CreatedAt,
		&token.ConsumedAt,
	)
}
