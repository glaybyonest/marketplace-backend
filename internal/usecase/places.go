package usecase

import (
	"context"
	"strings"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
)

type PlacesRepository interface {
	Create(ctx context.Context, place domain.Place) (domain.Place, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Place, error)
	GetByIDForUser(ctx context.Context, placeID, userID uuid.UUID) (domain.Place, error)
	Update(ctx context.Context, place domain.Place) (domain.Place, error)
	Delete(ctx context.Context, placeID, userID uuid.UUID) (bool, error)
}

type CreatePlaceInput struct {
	Title       string
	AddressText string
	Lat         *float64
	Lon         *float64
}

type PlacesService struct {
	places PlacesRepository
}

func NewPlacesService(places PlacesRepository) *PlacesService {
	return &PlacesService{places: places}
}

func (s *PlacesService) Create(ctx context.Context, userID uuid.UUID, input CreatePlaceInput) (domain.Place, error) {
	if userID == uuid.Nil {
		return domain.Place{}, domain.ErrUnauthorized
	}

	place := domain.Place{
		ID:          uuid.New(),
		UserID:      userID,
		Title:       strings.TrimSpace(input.Title),
		AddressText: strings.TrimSpace(input.AddressText),
		Lat:         input.Lat,
		Lon:         input.Lon,
	}
	if err := validatePlace(place.Title, place.AddressText, place.Lat, place.Lon); err != nil {
		return domain.Place{}, err
	}
	return s.places.Create(ctx, place)
}

func (s *PlacesService) List(ctx context.Context, userID uuid.UUID) ([]domain.Place, error) {
	if userID == uuid.Nil {
		return nil, domain.ErrUnauthorized
	}
	return s.places.ListByUser(ctx, userID)
}

func (s *PlacesService) Update(ctx context.Context, userID, placeID uuid.UUID, patch domain.PlacePatch) (domain.Place, error) {
	if userID == uuid.Nil {
		return domain.Place{}, domain.ErrUnauthorized
	}
	if placeID == uuid.Nil {
		return domain.Place{}, domain.ErrInvalidInput
	}

	current, err := s.places.GetByIDForUser(ctx, placeID, userID)
	if err != nil {
		return domain.Place{}, err
	}

	if patch.Title != nil {
		current.Title = strings.TrimSpace(*patch.Title)
	}
	if patch.AddressText != nil {
		current.AddressText = strings.TrimSpace(*patch.AddressText)
	}
	if patch.Lat != nil {
		current.Lat = patch.Lat
	}
	if patch.Lon != nil {
		current.Lon = patch.Lon
	}

	if err := validatePlace(current.Title, current.AddressText, current.Lat, current.Lon); err != nil {
		return domain.Place{}, err
	}

	return s.places.Update(ctx, current)
}

func (s *PlacesService) Delete(ctx context.Context, userID, placeID uuid.UUID) error {
	if userID == uuid.Nil {
		return domain.ErrUnauthorized
	}
	if placeID == uuid.Nil {
		return domain.ErrInvalidInput
	}

	deleted, err := s.places.Delete(ctx, placeID, userID)
	if err != nil {
		return err
	}
	if !deleted {
		return domain.ErrNotFound
	}
	return nil
}

func validatePlace(title, address string, lat, lon *float64) error {
	if strings.TrimSpace(title) == "" || len(title) > 120 {
		return domain.ErrInvalidInput
	}
	if strings.TrimSpace(address) == "" || len(address) > 255 {
		return domain.ErrInvalidInput
	}

	if lat != nil && (*lat < -90 || *lat > 90) {
		return domain.ErrInvalidInput
	}
	if lon != nil && (*lon < -180 || *lon > 180) {
		return domain.ErrInvalidInput
	}
	return nil
}
