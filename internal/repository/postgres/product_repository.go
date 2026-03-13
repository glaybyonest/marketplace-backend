package postgres

import (
	"context"
	"encoding/json"
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

const productSelectColumns = `
		p.id,
		p.category_id,
		c.name,
		p.name,
		p.slug,
		COALESCE(p.description, ''),
		p.price::double precision,
		p.currency,
		p.sku,
		COALESCE(p.image_url, ''),
		COALESCE(p.gallery, '[]'::jsonb),
		COALESCE(p.brand, ''),
		COALESCE(p.unit, ''),
		COALESCE(p.specs, '{}'::jsonb),
		p.stock_qty,
		p.is_active,
		p.created_at,
		p.updated_at
`

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
		SELECT ` + productSelectColumns + `
		FROM products p
		INNER JOIN categories c ON c.id = p.category_id
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
		SELECT `+productSelectColumns+`
		FROM products p
		INNER JOIN categories c ON c.id = p.category_id
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
		SELECT `+productSelectColumns+`
		FROM products p
		INNER JOIN categories c ON c.id = p.category_id
		WHERE slug = $1 AND is_active = TRUE
	`, slug)

	var product domain.Product
	if err := scanProduct(row, &product); err != nil {
		return domain.Product{}, mapError(err)
	}
	return product, nil
}

func scanProduct(row pgx.Row, product *domain.Product) error {
	var galleryRaw []byte
	var specsRaw []byte

	err := row.Scan(
		&product.ID,
		&product.CategoryID,
		&product.CategoryName,
		&product.Name,
		&product.Slug,
		&product.Description,
		&product.Price,
		&product.Currency,
		&product.SKU,
		&product.ImageURL,
		&galleryRaw,
		&product.Brand,
		&product.Unit,
		&specsRaw,
		&product.StockQty,
		&product.IsActive,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	if err != nil {
		return err
	}

	images, err := decodeProductImages(product.ImageURL, galleryRaw)
	if err != nil {
		return err
	}
	product.Images = images

	specs, err := decodeProductSpecs(specsRaw)
	if err != nil {
		return err
	}
	product.Specs = specs

	return nil
}

func decodeProductImages(imageURL string, galleryRaw []byte) ([]string, error) {
	images := make([]string, 0, 4)
	seen := make(map[string]struct{}, 4)

	appendImage := func(value string) {
		value = strings.TrimSpace(value)
		if value == "" {
			return
		}
		if _, exists := seen[value]; exists {
			return
		}
		seen[value] = struct{}{}
		images = append(images, value)
	}

	appendImage(imageURL)

	if len(galleryRaw) == 0 {
		return images, nil
	}

	var gallery []string
	if err := json.Unmarshal(galleryRaw, &gallery); err != nil {
		return nil, fmt.Errorf("decode product gallery: %w", err)
	}
	for _, image := range gallery {
		appendImage(image)
	}
	return images, nil
}

func decodeProductSpecs(specsRaw []byte) (map[string]any, error) {
	if len(specsRaw) == 0 {
		return map[string]any{}, nil
	}

	specs := make(map[string]any)
	if err := json.Unmarshal(specsRaw, &specs); err != nil {
		return nil, fmt.Errorf("decode product specs: %w", err)
	}
	return specs, nil
}
