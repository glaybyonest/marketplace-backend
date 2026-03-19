package domain

import (
	"time"

	"github.com/google/uuid"
)

type SellerStatus string

const (
	SellerStatusPending SellerStatus = "pending"
	SellerStatusActive  SellerStatus = "active"
	SellerStatusPaused  SellerStatus = "paused"
)

type SellerProfile struct {
	UserID       uuid.UUID    `json:"user_id"`
	StoreName    string       `json:"store_name"`
	StoreSlug    string       `json:"store_slug"`
	LegalName    string       `json:"legal_name,omitempty"`
	Description  string       `json:"description,omitempty"`
	LogoURL      string       `json:"logo_url,omitempty"`
	BannerURL    string       `json:"banner_url,omitempty"`
	SupportEmail string       `json:"support_email,omitempty"`
	SupportPhone string       `json:"support_phone,omitempty"`
	City         string       `json:"city,omitempty"`
	Status       SellerStatus `json:"status"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type SellerMetrics struct {
	ProductsTotal    int     `json:"products_total"`
	ActiveProducts   int     `json:"active_products"`
	HiddenProducts   int     `json:"hidden_products"`
	LowStockProducts int     `json:"low_stock_products"`
	OrdersTotal      int     `json:"orders_total"`
	UnitsSold        int     `json:"units_sold"`
	GrossRevenue     float64 `json:"gross_revenue"`
}

type SellerOrderSummary struct {
	OrderID      uuid.UUID   `json:"order_id"`
	Status       OrderStatus `json:"status"`
	Currency     string      `json:"currency"`
	CreatedAt    time.Time   `json:"created_at"`
	PlaceTitle   string      `json:"place_title"`
	ItemsCount   int         `json:"items_count"`
	GrossRevenue float64     `json:"gross_revenue"`
}

type SellerDashboard struct {
	Profile        SellerProfile        `json:"profile"`
	Metrics        SellerMetrics        `json:"metrics"`
	RecentProducts []Product            `json:"recent_products"`
	LowStock       []Product            `json:"low_stock"`
	RecentOrders   []SellerOrderSummary `json:"recent_orders"`
}
