package postgres

import (
	"context"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecommendationRepository struct {
	db *pgxpool.Pool
}

func NewRecommendationRepository(db *pgxpool.Pool) *RecommendationRepository {
	return &RecommendationRepository{db: db}
}

func (r *RecommendationRepository) FavoriteProductIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.db.Query(ctx, `
		SELECT product_id
		FROM favorites
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	ids := make([]uuid.UUID, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, mapError(err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, mapError(err)
	}
	return ids, nil
}

func (r *RecommendationRepository) FavoriteCategoryIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.db.Query(ctx, `
		SELECT DISTINCT p.category_id
		FROM favorites f
		INNER JOIN products p ON p.id = f.product_id
		WHERE f.user_id = $1
		ORDER BY p.category_id
	`, userID)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	ids := make([]uuid.UUID, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, mapError(err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, mapError(err)
	}
	return ids, nil
}

func (r *RecommendationRepository) ListByCategories(
	ctx context.Context,
	categoryIDs []uuid.UUID,
	excludeProductIDs []uuid.UUID,
	limit int,
) ([]domain.Product, error) {
	if len(categoryIDs) == 0 {
		return []domain.Product{}, nil
	}

	var exclude any
	if len(excludeProductIDs) > 0 {
		exclude = excludeProductIDs
	}

	rows, err := r.db.Query(ctx, `
		SELECT p.id, p.category_id, p.name, p.slug, COALESCE(p.description, ''), p.price::double precision,
		       p.currency, p.sku, p.stock_qty, p.is_active, p.created_at, p.updated_at
		FROM products p
		LEFT JOIN user_product_events e ON e.product_id = p.id
		WHERE p.is_active = TRUE
		  AND p.category_id = ANY($1)
		  AND ($2::uuid[] IS NULL OR NOT (p.id = ANY($2)))
		GROUP BY p.id
		ORDER BY COALESCE(SUM(CASE
			WHEN e.event_type = 'favorite_add' THEN 3
			WHEN e.event_type = 'view' THEN 1
			ELSE 0
		END), 0) DESC, p.created_at DESC
		LIMIT $3
	`, categoryIDs, exclude, limit)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	items := make([]domain.Product, 0, limit)
	for rows.Next() {
		var product domain.Product
		if err := scanProduct(rows, &product); err != nil {
			return nil, mapError(err)
		}
		items = append(items, product)
	}
	if err := rows.Err(); err != nil {
		return nil, mapError(err)
	}
	return items, nil
}

func (r *RecommendationRepository) ListPopular(ctx context.Context, excludeProductIDs []uuid.UUID, limit int) ([]domain.Product, error) {
	var exclude any
	if len(excludeProductIDs) > 0 {
		exclude = excludeProductIDs
	}

	rows, err := r.db.Query(ctx, `
		SELECT p.id, p.category_id, p.name, p.slug, COALESCE(p.description, ''), p.price::double precision,
		       p.currency, p.sku, p.stock_qty, p.is_active, p.created_at, p.updated_at
		FROM products p
		LEFT JOIN user_product_events e ON e.product_id = p.id
		WHERE p.is_active = TRUE
		  AND ($1::uuid[] IS NULL OR NOT (p.id = ANY($1)))
		GROUP BY p.id
		ORDER BY COALESCE(SUM(CASE
			WHEN e.event_type = 'favorite_add' THEN 3
			WHEN e.event_type = 'view' THEN 1
			ELSE 0
		END), 0) DESC, p.created_at DESC
		LIMIT $2
	`, exclude, limit)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	items := make([]domain.Product, 0, limit)
	for rows.Next() {
		var product domain.Product
		if err := scanProduct(rows, &product); err != nil {
			return nil, mapError(err)
		}
		items = append(items, product)
	}
	if err := rows.Err(); err != nil {
		return nil, mapError(err)
	}
	return items, nil
}
