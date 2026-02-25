package postgres

import (
	"context"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/usecase"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, input usecase.CreateUserInput) (domain.User, error) {
	const q = `
		INSERT INTO users (email, password_hash, full_name)
		VALUES ($1, $2, $3)
		RETURNING id, email, password_hash, full_name, created_at, updated_at, is_active
	`

	var user domain.User
	err := r.db.QueryRow(ctx, q, input.Email, input.PasswordHash, input.FullName).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.IsActive,
	)
	if err != nil {
		return domain.User{}, mapError(err)
	}
	return user, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	const q = `
		SELECT id, email, password_hash, full_name, created_at, updated_at, is_active
		FROM users
		WHERE email = $1
	`

	var user domain.User
	err := r.db.QueryRow(ctx, q, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.IsActive,
	)
	if err != nil {
		return domain.User{}, mapError(err)
	}
	return user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	const q = `
		SELECT id, email, password_hash, full_name, created_at, updated_at, is_active
		FROM users
		WHERE id = $1
	`

	var user domain.User
	err := r.db.QueryRow(ctx, q, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.IsActive,
	)
	if err != nil {
		return domain.User{}, mapError(err)
	}
	return user, nil
}

func (r *UserRepository) UpdateFullName(ctx context.Context, id uuid.UUID, fullName *string) (domain.User, error) {
	const q = `
		UPDATE users
		SET full_name = $2
		WHERE id = $1
		RETURNING id, email, password_hash, full_name, created_at, updated_at, is_active
	`

	var user domain.User
	err := r.db.QueryRow(ctx, q, id, fullName).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FullName,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.IsActive,
	)
	if err != nil {
		return domain.User{}, mapError(err)
	}
	return user, nil
}
