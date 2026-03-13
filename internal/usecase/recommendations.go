package usecase

import (
	"context"
	"time"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
)

type RecommendationRepository interface {
	FavoriteProductIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)
	FavoriteCategoryIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error)
	ListByCategories(ctx context.Context, categoryIDs []uuid.UUID, excludeProductIDs []uuid.UUID, limit int) ([]domain.Product, error)
	ListPopular(ctx context.Context, excludeProductIDs []uuid.UUID, limit int) ([]domain.Product, error)
	ListCached(ctx context.Context, userID uuid.UUID, limit int) ([]domain.Product, error)
	ReplaceCached(ctx context.Context, userID uuid.UUID, items []RecommendationCacheItem, refreshedAt time.Time) error
	ActiveUserIDs(ctx context.Context, since time.Time, limit int) ([]uuid.UUID, error)
	RefreshPopularityStats(ctx context.Context, refreshedAt time.Time) (int64, error)
}

type RecommendationCacheItem struct {
	ProductID uuid.UUID
	Rank      int
	Source    string
}

type RecommendationCandidate struct {
	Product domain.Product
	Source  string
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

	limit = normalizeRecommendationLimit(limit)
	cached, err := s.repository.ListCached(ctx, userID, limit)
	if err != nil {
		return nil, err
	}
	if len(cached) > 0 {
		return cached, nil
	}

	candidates, err := s.Build(ctx, userID, limit)
	if err != nil {
		return nil, err
	}
	return recommendationProducts(candidates), nil
}

func (s *RecommendationsService) Build(ctx context.Context, userID uuid.UUID, limit int) ([]RecommendationCandidate, error) {
	if userID == uuid.Nil {
		return nil, domain.ErrUnauthorized
	}

	limit = normalizeRecommendationLimit(limit)

	favoriteProductIDs, err := s.repository.FavoriteProductIDs(ctx, userID)
	if err != nil {
		return nil, err
	}

	favoriteCategoryIDs, err := s.repository.FavoriteCategoryIDs(ctx, userID)
	if err != nil {
		return nil, err
	}

	items := make([]RecommendationCandidate, 0, limit)
	if len(favoriteCategoryIDs) > 0 {
		fromFavoriteCategories, err := s.repository.ListByCategories(ctx, favoriteCategoryIDs, favoriteProductIDs, limit)
		if err != nil {
			return nil, err
		}
		for _, product := range fromFavoriteCategories {
			items = append(items, RecommendationCandidate{
				Product: product,
				Source:  "favorite_category",
			})
		}
	}

	if len(items) < limit {
		exclude := combineUniqueProductIDs(favoriteProductIDs, recommendationProducts(items))
		fallback, err := s.repository.ListPopular(ctx, exclude, limit-len(items))
		if err != nil {
			return nil, err
		}
		for _, product := range fallback {
			items = append(items, RecommendationCandidate{
				Product: product,
				Source:  "popular",
			})
		}
	}

	if len(items) > limit {
		items = items[:limit]
	}

	return items, nil
}

func (s *RecommendationsService) RefreshCache(ctx context.Context, activeSince time.Time, userLimit, recommendationLimit int) (int, error) {
	if userLimit <= 0 {
		userLimit = 200
	}
	userIDs, err := s.repository.ActiveUserIDs(ctx, activeSince, userLimit)
	if err != nil {
		return 0, err
	}

	for _, userID := range userIDs {
		candidates, err := s.Build(ctx, userID, recommendationLimit)
		if err != nil {
			return 0, err
		}

		cacheItems := make([]RecommendationCacheItem, 0, len(candidates))
		for index, candidate := range candidates {
			cacheItems = append(cacheItems, RecommendationCacheItem{
				ProductID: candidate.Product.ID,
				Rank:      index + 1,
				Source:    candidate.Source,
			})
		}

		if err := s.repository.ReplaceCached(ctx, userID, cacheItems, time.Now().UTC()); err != nil {
			return 0, err
		}
	}

	return len(userIDs), nil
}

func (s *RecommendationsService) RefreshPopularityStats(ctx context.Context) (int64, error) {
	return s.repository.RefreshPopularityStats(ctx, time.Now().UTC())
}

func normalizeRecommendationLimit(limit int) int {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return limit
}

func recommendationProducts(candidates []RecommendationCandidate) []domain.Product {
	items := make([]domain.Product, 0, len(candidates))
	for _, candidate := range candidates {
		items = append(items, candidate.Product)
	}
	return items
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
