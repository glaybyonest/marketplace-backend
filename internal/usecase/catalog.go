package usecase

import (
	"context"
	"strings"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
)

type CatalogCategoryRepository interface {
	List(ctx context.Context) ([]domain.Category, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.Category, error)
	GetBySlug(ctx context.Context, slug string) (domain.Category, error)
}

type CatalogProductRepository interface {
	List(ctx context.Context, filter domain.ProductFilter) (domain.PageResult[domain.Product], error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.Product, error)
	GetBySlug(ctx context.Context, slug string) (domain.Product, error)
}

type CatalogEventRepository interface {
	Create(ctx context.Context, userID, productID uuid.UUID, eventType string) error
}

type CatalogService struct {
	categories CatalogCategoryRepository
	products   CatalogProductRepository
	events     CatalogEventRepository
}

func NewCatalogService(
	categories CatalogCategoryRepository,
	products CatalogProductRepository,
	events CatalogEventRepository,
) *CatalogService {
	return &CatalogService{
		categories: categories,
		products:   products,
		events:     events,
	}
}

func (s *CatalogService) ListCategoriesTree(ctx context.Context) ([]domain.CategoryNode, error) {
	categories, err := s.categories.List(ctx)
	if err != nil {
		return nil, err
	}

	childrenByParent := make(map[uuid.UUID][]domain.Category)
	roots := make([]domain.Category, 0)
	for _, category := range categories {
		if category.ParentID == nil {
			roots = append(roots, category)
			continue
		}
		childrenByParent[*category.ParentID] = append(childrenByParent[*category.ParentID], category)
	}

	var build func(category domain.Category) domain.CategoryNode
	build = func(category domain.Category) domain.CategoryNode {
		node := domain.CategoryNode{
			ID:        category.ID,
			ParentID:  category.ParentID,
			Name:      category.Name,
			Slug:      category.Slug,
			CreatedAt: category.CreatedAt,
			UpdatedAt: category.UpdatedAt,
			Children:  make([]domain.CategoryNode, 0),
		}

		children := childrenByParent[category.ID]
		for _, child := range children {
			node.Children = append(node.Children, build(child))
		}
		return node
	}

	tree := make([]domain.CategoryNode, 0, len(roots))
	for _, root := range roots {
		tree = append(tree, build(root))
	}
	return tree, nil
}

func (s *CatalogService) GetCategoryByID(ctx context.Context, id uuid.UUID) (domain.Category, error) {
	if id == uuid.Nil {
		return domain.Category{}, domain.ErrInvalidInput
	}
	return s.categories.GetByID(ctx, id)
}

func (s *CatalogService) GetCategoryBySlug(ctx context.Context, slug string) (domain.Category, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return domain.Category{}, domain.ErrInvalidInput
	}
	return s.categories.GetBySlug(ctx, slug)
}

func (s *CatalogService) ListProducts(ctx context.Context, filter domain.ProductFilter) (domain.PageResult[domain.Product], error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}

	filter.Query = strings.TrimSpace(filter.Query)
	filter.Sort = strings.TrimSpace(filter.Sort)
	if filter.Sort == "" {
		filter.Sort = domain.SortNew
	}

	switch filter.Sort {
	case domain.SortNew, domain.SortPriceAsc, domain.SortPriceDesc:
	default:
		return domain.PageResult[domain.Product]{}, domain.ErrInvalidInput
	}

	return s.products.List(ctx, filter)
}

func (s *CatalogService) GetProductByID(ctx context.Context, id uuid.UUID) (domain.Product, error) {
	if id == uuid.Nil {
		return domain.Product{}, domain.ErrInvalidInput
	}
	return s.products.GetByID(ctx, id)
}

func (s *CatalogService) GetProductBySlug(ctx context.Context, slug string) (domain.Product, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return domain.Product{}, domain.ErrInvalidInput
	}
	return s.products.GetBySlug(ctx, slug)
}

func (s *CatalogService) TrackView(ctx context.Context, userID, productID uuid.UUID) error {
	if userID == uuid.Nil || productID == uuid.Nil {
		return domain.ErrInvalidInput
	}
	return s.events.Create(ctx, userID, productID, domain.ProductEventView)
}
