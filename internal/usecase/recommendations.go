package usecase

import (
	"context"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
)

type RecommendationRepository interface {
	FavoriteProductIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)
	FavoriteCategoryIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)
	ListByCategories(ctx context.Context, categoryIDs []uuid.UUID, excludeProductIDs []uuid.UUID, limit int) ([]domain.Product, error)
	ListPopular(ctx context.Context, excludeProductIDs []uuid.UUID, limit int) ([]domain.Product, error)
}

type RecommendationsService struct {
	repository RecommendationRepository
}

func NewRecommendationsService(repository RecommendationRepository) *RecommendationsService {
	return &RecommendationsService{repository: repository}
}

func (s *RecommendationsService) Get(ctx context.Context, userID uuid.UUID, limit int) ([]domain.Product, error) {
	if userID == uuid.Nil {
		return nil, domain.ErrUnauthorized
	}

	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	favoriteProductIDs, err := s.repository.FavoriteProductIDs(ctx, userID)
	if err != nil {
		return nil, err
	}

	favoriteCategoryIDs, err := s.repository.FavoriteCategoryIDs(ctx, userID)
	if err != nil {
		return nil, err
	}

	items := make([]domain.Product, 0, limit)
	if len(favoriteCategoryIDs) > 0 {
		fromFavoriteCategories, err := s.repository.ListByCategories(ctx, favoriteCategoryIDs, favoriteProductIDs, limit)
		if err != nil {
			return nil, err
		}
		items = append(items, fromFavoriteCategories...)
	}

	if len(items) < limit {
		exclude := combineUniqueProductIDs(favoriteProductIDs, items)
		fallback, err := s.repository.ListPopular(ctx, exclude, limit-len(items))
		if err != nil {
			return nil, err
		}
		items = append(items, fallback...)
	}

	if len(items) > limit {
		items = items[:limit]
	}

	return items, nil
}

func combineUniqueProductIDs(excluded []uuid.UUID, products []domain.Product) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{}, len(excluded)+len(products))
	combined := make([]uuid.UUID, 0, len(excluded)+len(products))

	for _, id := range excluded {
		if id == uuid.Nil {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		combined = append(combined, id)
	}
	for _, product := range products {
		if product.ID == uuid.Nil {
			continue
		}
		if _, ok := seen[product.ID]; ok {
			continue
		}
		seen[product.ID] = struct{}{}
		combined = append(combined, product.ID)
	}
	return combined
}
