package dto

type SellerProfileUpsertRequest struct {
	StoreName    string `json:"store_name" validate:"required,max=160"`
	StoreSlug    string `json:"store_slug" validate:"omitempty,max=160"`
	LegalName    string `json:"legal_name" validate:"omitempty,max=200"`
	Description  string `json:"description" validate:"omitempty,max=2000"`
	LogoURL      string `json:"logo_url" validate:"omitempty,url,max=2048"`
	BannerURL    string `json:"banner_url" validate:"omitempty,url,max=2048"`
	SupportEmail string `json:"support_email" validate:"omitempty,email,max=254"`
	SupportPhone string `json:"support_phone" validate:"omitempty,max=32"`
	City         string `json:"city" validate:"omitempty,max=120"`
	Status       string `json:"status" validate:"omitempty,oneof=pending active paused"`
}
