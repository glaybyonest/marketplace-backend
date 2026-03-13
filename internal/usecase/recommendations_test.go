package usecase

import (
	"context"
	"testing"
	"time"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type recommendationRepoMock struct {
	favoriteProducts []uuid.UUID
	favoriteCats     []uuid.UUID
	byCategories     []domain.Product
	popular          []domain.Product
	favProductErr    error
	favCategoryErr   error
	byCategoryErr    error
	popularErr       error
	lastLimitByCat   int
	lastLimitPopular int
	lastExclude      []uuid.UUID
	cached           []domain.Product
	cachedErr        error
	activeUsers      []uuid.UUID
	replacedCache    map[uuid.UUID][]RecommendationCacheItem
	refreshStatsRows int64
}

func (m *recommendationRepoMock) FavoriteProductIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	return m.favoriteProducts, m.favProductErr
}

func (m *recommendationRepoMock) FavoriteCategoryIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	return m.favoriteCats, m.favCategoryErr
}

func (m *recommendationRepoMock) ListByCategories(ctx context.Context, categoryIDs []uuid.UUID, excludeProductIDs []uuid.UUID, limit int) ([]domain.Product, error) {
	m.lastLimitByCat = limit
	m.lastExclude = excludeProductIDs
	if m.byCategoryErr != nil {
		return nil, m.byCategoryErr
	}
	if len(m.byCategories) > limit {
		return m.byCategories[:limit], nil
	}
	return m.byCategories, nil
}

func (m *recommendationRepoMock) ListPopular(ctx context.Context, excludeProductIDs []uuid.UUID, limit int) ([]domain.Product, error) {
	m.lastLimitPopular = limit
	m.lastExclude = excludeProductIDs
	if m.popularErr != nil {
		return nil, m.popularErr
	}
	if len(m.popular) > limit {
		return m.popular[:limit], nil
	}
	return m.popular, nil
}

func (m *recommendationRepoMock) ListCached(ctx context.Context, userID uuid.UUID, limit int) ([]domain.Product, error) {
	if m.cachedErr != nil {
		return nil, m.cachedErr
	}
	if len(m.cached) > limit {
		return m.cached[:limit], nil
	}
	return m.cached, nil
}

func (m *recommendationRepoMock) ReplaceCached(ctx context.Context, userID uuid.UUID, items []RecommendationCacheItem, refreshedAt time.Time) error {
	if m.replacedCache == nil {
		m.replacedCache = make(map[uuid.UUID][]RecommendationCacheItem)
	}
	m.replacedCache[userID] = append([]RecommendationCacheItem(nil), items...)
	return nil
}

func (m *recommendationRepoMock) ActiveUserIDs(ctx context.Context, since time.Time, limit int) ([]uuid.UUID, error) {
	if len(m.activeUsers) > limit {
		return m.activeUsers[:limit], nil
	}
	return m.activeUsers, nil
}

func (m *recommendationRepoMock) RefreshPopularityStats(ctx context.Context, refreshedAt time.Time) (int64, error) {
	return m.refreshStatsRows, nil
}

func TestRecommendationsService(t *testing.T) {
	product1 := domain.Product{ID: uuid.New(), Slug: "p1"}
	product2 := domain.Product{ID: uuid.New(), Slug: "p2"}
	product3 := domain.Product{ID: uuid.New(), Slug: "p3"}
	product4 := domain.Product{ID: uuid.New(), Slug: "p4"}
	categoryID := uuid.New()
	userID := uuid.New()

	repo := &recommendationRepoMock{
		favoriteProducts: []uuid.UUID{product1.ID},
		favoriteCats:     []uuid.UUID{categoryID},
		byCategories:     []domain.Product{product2, product3},
		popular:          []domain.Product{product4},
	}
	service := NewRecommendationsService(repo)

	tests := []struct {
		name      string
		limit     int
		userID    uuid.UUID
		prepare   func()
		wantErr   error
		wantCount int
	}{
		{"with favorites from categories", 20, userID, func() {}, nil, 3},
		{"use cached recommendations", 20, userID, func() { repo.cached = []domain.Product{product4} }, nil, 1},
		{"unauthorized", 20, uuid.Nil, func() {}, domain.ErrUnauthorized, 0},
		{"limit default", 0, userID, func() {}, nil, 3},
		{"limit capped", 1000, userID, func() {}, nil, 3},
		{"no favorite categories fallback", 20, userID, func() { repo.favoriteCats = nil }, nil, 1},
		{"no favorites and no popular", 20, userID, func() {
			repo.favoriteProducts = nil
			repo.favoriteCats = nil
			repo.popular = nil
		}, nil, 0},
		{"favorite product ids error", 20, userID, func() { repo.favProductErr = domain.ErrConflict }, domain.ErrConflict, 0},
		{"favorite category ids error", 20, userID, func() {
			repo.favProductErr = nil
			repo.favCategoryErr = domain.ErrConflict
		}, domain.ErrConflict, 0},
		{"by categories error", 20, userID, func() {
			repo.favCategoryErr = nil
			repo.byCategoryErr = domain.ErrConflict
		}, domain.ErrConflict, 0},
		{"popular error", 20, userID, func() {
			repo.byCategoryErr = nil
			repo.byCategories = nil
			repo.popularErr = domain.ErrConflict
		}, domain.ErrConflict, 0},
		{"respect limit exact", 2, userID, func() {
			repo.popularErr = nil
			repo.byCategories = []domain.Product{product2, product3, product4}
			repo.popular = []domain.Product{}
		}, nil, 2},
		{"fill with fallback when category short", 3, userID, func() {
			repo.byCategories = []domain.Product{product2}
			repo.popular = []domain.Product{product3, product4}
		}, nil, 3},
		{"deduplicate exclude ids", 3, userID, func() {
			repo.favoriteProducts = []uuid.UUID{product1.ID, product1.ID}
			repo.byCategories = []domain.Product{product2}
			repo.popular = []domain.Product{product2, product3}
		}, nil, 3},
		{"limit one", 1, userID, func() {
			repo.favoriteProducts = []uuid.UUID{product1.ID}
			repo.byCategories = []domain.Product{product2, product3}
			repo.popular = []domain.Product{product4}
		}, nil, 1},
		{"limit two", 2, userID, func() {}, nil, 2},
		{"limit three", 3, userID, func() {}, nil, 3},
		{"category query limit called", 4, userID, func() {}, nil, 3},
		{"popular query limit called", 5, userID, func() {
			repo.byCategories = nil
			repo.popular = []domain.Product{product2, product3, product4}
		}, nil, 3},
		{"empty category result uses popular", 2, userID, func() {
			repo.byCategories = nil
			repo.popular = []domain.Product{product2, product3}
		}, nil, 2},
		{"empty all sources", 2, userID, func() {
			repo.byCategories = nil
			repo.popular = nil
		}, nil, 0},
		{"exclude includes category items", 4, userID, func() {
			repo.byCategories = []domain.Product{product2}
			repo.popular = []domain.Product{product3, product4}
		}, nil, 3},
		{"negative limit defaults", -10, userID, func() {}, nil, 3},
		{"single favorite no category", 2, userID, func() {
			repo.favoriteProducts = []uuid.UUID{product1.ID}
			repo.favoriteCats = nil
			repo.popular = []domain.Product{product2}
		}, nil, 1},
		{"multiple favorites with popular", 4, userID, func() {
			repo.favoriteProducts = []uuid.UUID{product1.ID, product2.ID}
			repo.favoriteCats = []uuid.UUID{categoryID}
			repo.byCategories = []domain.Product{product3}
			repo.popular = []domain.Product{product4}
		}, nil, 2},
		{"no categories but has favorites", 4, userID, func() {
			repo.favoriteProducts = []uuid.UUID{product1.ID, product2.ID}
			repo.favoriteCats = []uuid.UUID{}
			repo.popular = []domain.Product{product3, product4}
		}, nil, 2},
		{"no favorites categories still popular", 4, userID, func() {
			repo.favoriteProducts = nil
			repo.favoriteCats = nil
			repo.popular = []domain.Product{product3, product4}
		}, nil, 2},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			// reset defaults before each case
			repo.favoriteProducts = []uuid.UUID{product1.ID}
			repo.favoriteCats = []uuid.UUID{categoryID}
			repo.byCategories = []domain.Product{product2, product3}
			repo.popular = []domain.Product{product4}
			repo.favProductErr = nil
			repo.favCategoryErr = nil
			repo.byCategoryErr = nil
			repo.popularErr = nil
			repo.lastLimitByCat = 0
			repo.lastLimitPopular = 0
			repo.lastExclude = nil
			repo.cached = nil
			repo.cachedErr = nil

			tc.prepare()
			items, err := service.Get(context.Background(), tc.userID, tc.limit)
			if tc.wantErr != nil {
				require.Error(t, err)
				assert.ErrorIs(t, err, tc.wantErr)
				return
			}

			require.NoError(t, err)
			assert.Len(t, items, tc.wantCount)
			if tc.name == "category query limit called" {
				assert.Equal(t, 4, repo.lastLimitByCat)
			}
			if tc.name == "popular query limit called" {
				assert.Equal(t, 5, repo.lastLimitPopular)
			}
		})
	}

	t.Run("refresh recommendation cache", func(t *testing.T) {
		repo.cached = nil
		repo.favoriteProducts = []uuid.UUID{product1.ID}
		repo.favoriteCats = []uuid.UUID{categoryID}
		repo.byCategories = []domain.Product{product2}
		repo.popular = []domain.Product{product3}
		repo.activeUsers = []uuid.UUID{userID}

		refreshed, err := service.RefreshCache(context.Background(), time.Now().Add(-24*time.Hour), 50, 10)
		require.NoError(t, err)
		assert.Equal(t, 1, refreshed)
		require.Contains(t, repo.replacedCache, userID)
		require.Len(t, repo.replacedCache[userID], 2)
		assert.Equal(t, "favorite_category", repo.replacedCache[userID][0].Source)
		assert.Equal(t, "popular", repo.replacedCache[userID][1].Source)
	})
}
