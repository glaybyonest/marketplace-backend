package postgres

import (
	"context"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CategoryRepository struct {
	db *pgxpool.Pool
}

func NewCategoryRepository(db *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) List(ctx context.Context) ([]domain.Category, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, parent_id, name, slug, created_at, updated_at
		FROM categories
		ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	items := make([]domain.Category, 0)
	for rows.Next() {
		var category domain.Category
		if err := scanCategory(rows, &category); err != nil {
			return nil, mapError(err)
		}
		items = append(items, category)
	}
	if err := rows.Err(); err != nil {
		return nil, mapError(err)
	}
	return items, nil
}

func (r *CategoryRepository) GetByID(ctx context.Context, id uuid.UUID) (domain.Category, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, parent_id, name, slug, created_at, updated_at
		FROM categories
		WHERE id = $1
	`, id)

	var category domain.Category
	if err := scanCategory(row, &category); err != nil {
		return domain.Category{}, mapError(err)
	}
	return category, nil
}

func (r *CategoryRepository) GetBySlug(ctx context.Context, slug string) (domain.Category, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, parent_id, name, slug, created_at, updated_at
		FROM categories
		WHERE slug = $1
	`, slug)

	var category domain.Category
	if err := scanCategory(row, &category); err != nil {
		return domain.Category{}, mapError(err)
	}
	return category, nil
}

func scanCategory(row pgx.Row, category *domain.Category) error {
	return row.Scan(
		&category.ID,
		&category.ParentID,
		&category.Name,
		&category.Slug,
		&category.CreatedAt,
		&category.UpdatedAt,
	)
}
