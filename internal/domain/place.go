package domain

import (
	"time"

	"github.com/google/uuid"
)

// Place is a saved user location.
type Place struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Title       string    `json:"title"`
	AddressText string    `json:"address_text"`
	Lat         *float64  `json:"lat,omitempty"`
	Lon         *float64  `json:"lon,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// PlacePatch is a partial update payload.
type PlacePatch struct {
	Title       *string
	AddressText *string
	Lat         *float64
	Lon         *float64
}
