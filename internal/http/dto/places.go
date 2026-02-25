package dto

type CreatePlaceRequest struct {
	Title       string   `json:"title" validate:"required,max=120"`
	AddressText string   `json:"address_text" validate:"required,max=255"`
	Lat         *float64 `json:"lat,omitempty"`
	Lon         *float64 `json:"lon,omitempty"`
}

type UpdatePlaceRequest struct {
	Title       *string  `json:"title,omitempty" validate:"omitempty,max=120"`
	AddressText *string  `json:"address_text,omitempty" validate:"omitempty,max=255"`
	Lat         *float64 `json:"lat,omitempty"`
	Lon         *float64 `json:"lon,omitempty"`
}
