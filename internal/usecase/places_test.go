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

type placesRepoMock struct {
	items map[uuid.UUID]domain.Place
}

func (m *placesRepoMock) Create(ctx context.Context, place domain.Place) (domain.Place, error) {
	place.CreatedAt = time.Now().UTC()
	place.UpdatedAt = place.CreatedAt
	m.items[place.ID] = place
	return place, nil
}

func (m *placesRepoMock) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Place, error) {
	result := make([]domain.Place, 0)
	for _, item := range m.items {
		if item.UserID == userID {
			result = append(result, item)
		}
	}
	return result, nil
}

func (m *placesRepoMock) GetByIDForUser(ctx context.Context, placeID, userID uuid.UUID) (domain.Place, error) {
	item, ok := m.items[placeID]
	if !ok || item.UserID != userID {
		return domain.Place{}, domain.ErrNotFound
	}
	return item, nil
}

func (m *placesRepoMock) Update(ctx context.Context, place domain.Place) (domain.Place, error) {
	if _, ok := m.items[place.ID]; !ok {
		return domain.Place{}, domain.ErrNotFound
	}
	place.UpdatedAt = time.Now().UTC()
	m.items[place.ID] = place
	return place, nil
}

func (m *placesRepoMock) Delete(ctx context.Context, placeID, userID uuid.UUID) (bool, error) {
	item, ok := m.items[placeID]
	if !ok || item.UserID != userID {
		return false, nil
	}
	delete(m.items, placeID)
	return true, nil
}

func TestPlacesService(t *testing.T) {
	repo := &placesRepoMock{items: map[uuid.UUID]domain.Place{}}
	service := NewPlacesService(repo)
	userID := uuid.New()
	otherUserID := uuid.New()

	created, err := service.Create(context.Background(), userID, CreatePlaceInput{
		Title:       "Home",
		AddressText: "Main st",
	})
	require.NoError(t, err)

	tests := []struct {
		name    string
		run     func() error
		wantErr error
	}{
		{"create success", func() error {
			_, err := service.Create(context.Background(), userID, CreatePlaceInput{Title: "Warehouse", AddressText: "Storage st"})
			return err
		}, nil},
		{"create unauthorized", func() error {
			_, err := service.Create(context.Background(), uuid.Nil, CreatePlaceInput{Title: "x", AddressText: "x"})
			return err
		}, domain.ErrUnauthorized},
		{"create empty title", func() error {
			_, err := service.Create(context.Background(), userID, CreatePlaceInput{Title: "", AddressText: "x"})
			return err
		}, domain.ErrInvalidInput},
		{"create empty address", func() error {
			_, err := service.Create(context.Background(), userID, CreatePlaceInput{Title: "x", AddressText: ""})
			return err
		}, domain.ErrInvalidInput},
		{"create lat range low", func() error {
			lat := -91.0
			_, err := service.Create(context.Background(), userID, CreatePlaceInput{Title: "x", AddressText: "x", Lat: &lat})
			return err
		}, domain.ErrInvalidInput},
		{"create lat range high", func() error {
			lat := 91.0
			_, err := service.Create(context.Background(), userID, CreatePlaceInput{Title: "x", AddressText: "x", Lat: &lat})
			return err
		}, domain.ErrInvalidInput},
		{"create lon range low", func() error {
			lon := -181.0
			_, err := service.Create(context.Background(), userID, CreatePlaceInput{Title: "x", AddressText: "x", Lon: &lon})
			return err
		}, domain.ErrInvalidInput},
		{"create lon range high", func() error {
			lon := 181.0
			_, err := service.Create(context.Background(), userID, CreatePlaceInput{Title: "x", AddressText: "x", Lon: &lon})
			return err
		}, domain.ErrInvalidInput},
		{"create valid lat lon", func() error {
			lat, lon := 55.75, 37.61
			_, err := service.Create(context.Background(), userID, CreatePlaceInput{Title: "Moscow", AddressText: "Center", Lat: &lat, Lon: &lon})
			return err
		}, nil},
		{"list success", func() error { _, err := service.List(context.Background(), userID); return err }, nil},
		{"list unauthorized", func() error { _, err := service.List(context.Background(), uuid.Nil); return err }, domain.ErrUnauthorized},
		{"update success title", func() error {
			title := "Updated"
			_, err := service.Update(context.Background(), userID, created.ID, domain.PlacePatch{Title: &title})
			return err
		}, nil},
		{"update success address", func() error {
			address := "New address"
			_, err := service.Update(context.Background(), userID, created.ID, domain.PlacePatch{AddressText: &address})
			return err
		}, nil},
		{"update success lat lon", func() error {
			lat, lon := 10.5, 20.5
			_, err := service.Update(context.Background(), userID, created.ID, domain.PlacePatch{Lat: &lat, Lon: &lon})
			return err
		}, nil},
		{"update unauthorized", func() error {
			title := "x"
			_, err := service.Update(context.Background(), uuid.Nil, created.ID, domain.PlacePatch{Title: &title})
			return err
		}, domain.ErrUnauthorized},
		{"update invalid place id", func() error {
			title := "x"
			_, err := service.Update(context.Background(), userID, uuid.Nil, domain.PlacePatch{Title: &title})
			return err
		}, domain.ErrInvalidInput},
		{"update not found", func() error {
			title := "x"
			_, err := service.Update(context.Background(), userID, uuid.New(), domain.PlacePatch{Title: &title})
			return err
		}, domain.ErrNotFound},
		{"update foreign place blocked", func() error {
			title := "x"
			_, err := service.Update(context.Background(), otherUserID, created.ID, domain.PlacePatch{Title: &title})
			return err
		}, domain.ErrNotFound},
		{"update invalid lat", func() error {
			lat := 120.0
			_, err := service.Update(context.Background(), userID, created.ID, domain.PlacePatch{Lat: &lat})
			return err
		}, domain.ErrInvalidInput},
		{"update invalid lon", func() error {
			lon := -190.0
			_, err := service.Update(context.Background(), userID, created.ID, domain.PlacePatch{Lon: &lon})
			return err
		}, domain.ErrInvalidInput},
		{"update invalid title empty", func() error {
			title := "   "
			_, err := service.Update(context.Background(), userID, created.ID, domain.PlacePatch{Title: &title})
			return err
		}, domain.ErrInvalidInput},
		{"delete success", func() error { return service.Delete(context.Background(), userID, created.ID) }, nil},
		{"delete already deleted", func() error { return service.Delete(context.Background(), userID, created.ID) }, domain.ErrNotFound},
		{"delete unauthorized", func() error { return service.Delete(context.Background(), uuid.Nil, uuid.New()) }, domain.ErrUnauthorized},
		{"delete invalid id", func() error { return service.Delete(context.Background(), userID, uuid.Nil) }, domain.ErrInvalidInput},
		{"delete foreign place", func() error {
			other, _ := service.Create(context.Background(), otherUserID, CreatePlaceInput{Title: "Other", AddressText: "Addr"})
			return service.Delete(context.Background(), userID, other.ID)
		}, domain.ErrNotFound},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			err := tc.run()
			if tc.wantErr == nil {
				require.NoError(t, err)
			} else {
				require.Error(t, err)
				assert.ErrorIs(t, err, tc.wantErr)
			}
		})
	}
}
