package usecase

import (
	"context"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
)

type FavoritesRepository interface {
	Add(ctx context.Context, userID, productID uuid.UUID) (bool, error)
	Remove(ctx context.Context, userID, productID uuid.UUID) (bool, error)
	List(ctx context.Context, userID uuid.UUID, page, limit int) (domain.PageResult[domain.Product], error)
}

type FavoritesProductRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (domain.Product, error)
}

type FavoritesEventRepository interface {
	Create(ctx context.Context, userID, productID uuid.UUID, eventType string) error
}

type FavoritesService struct {
	favorites FavoritesRepository
	products  FavoritesProductRepository
	events    FavoritesEventRepository
}

func NewFavoritesService(
	favorites FavoritesRepository,
	products FavoritesProductRepository,
	events FavoritesEventRepository,
) *FavoritesService {
	return &FavoritesService{
		favorites: favorites,
		products:  products,
		events:    events,
	}
}

func (s *FavoritesService) Add(ctx context.Context, userID, productID uuid.UUID) (bool, error) {
	if userID == uuid.Nil || productID == uuid.Nil {
		return false, domain.ErrInvalidInput
	}

	if _, err := s.products.GetByID(ctx, productID); err != nil {
		return false, err
	}

	created, err := s.favorites.Add(ctx, userID, productID)
	if err != nil {
		return false, err
	}
	if created {
		_ = s.events.Create(ctx, userID, productID, domain.ProductEventFavoriteAdd)
	}
	return created, nil
}

func (s *FavoritesService) Remove(ctx context.Context, userID, productID uuid.UUID) error {
	if userID == uuid.Nil || productID == uuid.Nil {
		return domain.ErrInvalidInput
	}
	_, err := s.favorites.Remove(ctx, userID, productID)
	return err
}

func (s *FavoritesService) List(ctx context.Context, userID uuid.UUID, page, limit int) (domain.PageResult[domain.Product], error) {
	if userID == uuid.Nil {
		return domain.PageResult[domain.Product]{}, domain.ErrUnauthorized
	}
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return s.favorites.List(ctx, userID, page, limit)
}
