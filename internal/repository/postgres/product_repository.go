package postgres

import (
	"context"
	"fmt"
	"strings"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductRepository struct {
	db *pgxpool.Pool
}

func NewProductRepository(db *pgxpool.Pool) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) List(ctx context.Context, filter domain.ProductFilter) (domain.PageResult[domain.Product], error) {
	where := []string{"p.is_active = TRUE"}
	args := make([]any, 0, 6)

	if filter.CategoryID != nil {
		args = append(args, *filter.CategoryID)
		where = append(where, fmt.Sprintf("p.category_id = $%d", len(args)))
	}
	if filter.Query != "" {
		args = append(args, "%"+strings.ToLower(filter.Query)+"%")
		where = append(where, fmt.Sprintf("LOWER(p.name) LIKE $%d", len(args)))
	}

	condition := strings.Join(where, " AND ")
	countSQL := "SELECT COUNT(*) FROM products p WHERE " + condition

	var total int
	if err := r.db.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return domain.PageResult[domain.Product]{}, mapError(err)
	}

	orderBy := "p.created_at DESC"
	switch filter.Sort {
	case domain.SortPriceAsc:
		orderBy = "p.price ASC, p.created_at DESC"
	case domain.SortPriceDesc:
		orderBy = "p.price DESC, p.created_at DESC"
	case domain.SortNew:
		orderBy = "p.created_at DESC"
	}

	offset := (filter.Page - 1) * filter.Limit
	args = append(args, filter.Limit, offset)
	limitPos := len(args) - 1
	offsetPos := len(args)

	querySQL := `
		SELECT p.id, p.category_id, p.name, p.slug, COALESCE(p.description, ''), p.price::double precision,
		       p.currency, p.sku, p.stock_qty, p.is_active, p.created_at, p.updated_at
		FROM products p
		WHERE ` + condition + `
		ORDER BY ` + orderBy + `
		LIMIT $` + fmt.Sprint(limitPos) + ` OFFSET $` + fmt.Sprint(offsetPos)

	rows, err := r.db.Query(ctx, querySQL, args...)
	if err != nil {
		return domain.PageResult[domain.Product]{}, mapError(err)
	}
	defer rows.Close()

	items := make([]domain.Product, 0, filter.Limit)
	for rows.Next() {
		var product domain.Product
		if err := scanProduct(rows, &product); err != nil {
			return domain.PageResult[domain.Product]{}, mapError(err)
		}
		items = append(items, product)
	}
	if err := rows.Err(); err != nil {
		return domain.PageResult[domain.Product]{}, mapError(err)
	}

	return domain.PageResult[domain.Product]{
		Items: items,
		Page:  filter.Page,
		Limit: filter.Limit,
		Total: total,
	}, nil
}

func (r *ProductRepository) GetByID(ctx context.Context, id uuid.UUID) (domain.Product, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, category_id, name, slug, COALESCE(description, ''), price::double precision,
		       currency, sku, stock_qty, is_active, created_at, updated_at
		FROM products
		WHERE id = $1 AND is_active = TRUE
	`, id)

	var product domain.Product
	if err := scanProduct(row, &product); err != nil {
		return domain.Product{}, mapError(err)
	}
	return product, nil
}

func (r *ProductRepository) GetBySlug(ctx context.Context, slug string) (domain.Product, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, category_id, name, slug, COALESCE(description, ''), price::double precision,
		       currency, sku, stock_qty, is_active, created_at, updated_at
		FROM products
		WHERE slug = $1 AND is_active = TRUE
	`, slug)

	var product domain.Product
	if err := scanProduct(row, &product); err != nil {
		return domain.Product{}, mapError(err)
	}
	return product, nil
}

func scanProduct(row pgx.Row, product *domain.Product) error {
	return row.Scan(
		&product.ID,
		&product.CategoryID,
		&product.Name,
		&product.Slug,
		&product.Description,
		&product.Price,
		&product.Currency,
		&product.SKU,
		&product.StockQty,
		&product.IsActive,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
}
