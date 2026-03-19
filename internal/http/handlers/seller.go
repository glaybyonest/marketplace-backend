package handlers

import (
	"context"
	"net/http"
	"strings"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/http/dto"
	httpmw "marketplace-backend/internal/http/middleware"
	"marketplace-backend/internal/http/response"
	"marketplace-backend/internal/usecase"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type SellerService interface {
	GetProfile(ctx context.Context, userID uuid.UUID) (domain.SellerProfile, error)
	UpsertProfile(ctx context.Context, userID uuid.UUID, input usecase.SellerProfileInput) (domain.SellerProfile, error)
	Dashboard(ctx context.Context, userID uuid.UUID) (domain.SellerDashboard, error)
	ListProducts(ctx context.Context, userID uuid.UUID, filter domain.ProductFilter) (domain.PageResult[domain.Product], error)
	CreateProduct(ctx context.Context, userID uuid.UUID, input usecase.SellerProductInput) (domain.Product, error)
	UpdateProduct(ctx context.Context, userID, productID uuid.UUID, input usecase.SellerProductInput) (domain.Product, error)
	UpdateProductStock(ctx context.Context, userID, productID uuid.UUID, stockQty int) (domain.Product, error)
	DeleteProduct(ctx context.Context, userID, productID uuid.UUID) (domain.Product, error)
	ListOrders(ctx context.Context, userID uuid.UUID, page, limit int) (domain.PageResult[domain.SellerOrderSummary], error)
}

type SellerHandler struct {
	service  SellerService
	validate *validator.Validate
}

func NewSellerHandler(service SellerService) *SellerHandler {
	return &SellerHandler{
		service:  service,
		validate: validator.New(validator.WithRequiredStructEnabled()),
	}
}

func (h *SellerHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	profile, err := h.service.GetProfile(r.Context(), userID)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}
	response.JSON(w, http.StatusOK, profile)
}

func (h *SellerHandler) UpsertProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	var req dto.SellerProfileUpsertRequest
	if err := decodeAndValidate(r, &req, h.validate); err != nil {
		writeDomainError(w, r, err)
		return
	}

	profile, err := h.service.UpsertProfile(r.Context(), userID, usecase.SellerProfileInput{
		StoreName:    req.StoreName,
		StoreSlug:    req.StoreSlug,
		LegalName:    req.LegalName,
		Description:  req.Description,
		LogoURL:      req.LogoURL,
		BannerURL:    req.BannerURL,
		SupportEmail: req.SupportEmail,
		SupportPhone: req.SupportPhone,
		City:         req.City,
		Status:       domain.SellerStatus(strings.TrimSpace(req.Status)),
	})
	if err != nil {
		writeDomainError(w, r, err)
		return
	}

	response.JSON(w, http.StatusOK, profile)
}

func (h *SellerHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	dashboard, err := h.service.Dashboard(r.Context(), userID)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}

	response.JSON(w, http.StatusOK, dashboard)
}

func (h *SellerHandler) ProductsList(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	query := r.URL.Query()
	filter := domain.ProductFilter{
		Query: strings.TrimSpace(query.Get("q")),
		Sort:  strings.TrimSpace(query.Get("sort")),
		Page:  parseIntWithDefault(query.Get("page"), 1),
		Limit: parseIntWithDefault(query.Get("limit"), 20),
	}

	if rawCategoryID := strings.TrimSpace(query.Get("category_id")); rawCategoryID != "" {
		categoryID, err := uuid.Parse(rawCategoryID)
		if err != nil {
			writeDomainError(w, r, domain.ErrInvalidInput)
			return
		}
		filter.CategoryID = &categoryID
	}
	if minPrice, ok, err := parseOptionalFloat(query.Get("min_price")); err != nil {
		writeDomainError(w, r, domain.ErrInvalidInput)
		return
	} else if ok {
		filter.MinPrice = &minPrice
	}
	if maxPrice, ok, err := parseOptionalFloat(query.Get("max_price")); err != nil {
		writeDomainError(w, r, domain.ErrInvalidInput)
		return
	} else if ok {
		filter.MaxPrice = &maxPrice
	}
	if inStock, ok, err := parseOptionalBool(query.Get("in_stock")); err != nil {
		writeDomainError(w, r, domain.ErrInvalidInput)
		return
	} else if ok {
		filter.InStock = &inStock
	}
	if isActive, ok, err := parseOptionalBool(query.Get("is_active")); err != nil {
		writeDomainError(w, r, domain.ErrInvalidInput)
		return
	} else if ok {
		filter.IsActive = &isActive
	}

	items, err := h.service.ListProducts(r.Context(), userID, filter)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}
	response.JSON(w, http.StatusOK, items)
}

func (h *SellerHandler) ProductCreate(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	var req dto.AdminProductUpsertRequest
	if err := decodeAndValidate(r, &req, h.validate); err != nil {
		writeDomainError(w, r, err)
		return
	}

	input, err := toAdminProductInput(req)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}

	product, err := h.service.CreateProduct(r.Context(), userID, usecase.SellerProductInput(input))
	if err != nil {
		writeDomainError(w, r, err)
		return
	}
	response.JSON(w, http.StatusCreated, product)
}

func (h *SellerHandler) ProductUpdate(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	productID, err := parseUUIDParam("id", r)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}

	var req dto.AdminProductUpsertRequest
	if err := decodeAndValidate(r, &req, h.validate); err != nil {
		writeDomainError(w, r, err)
		return
	}

	input, err := toAdminProductInput(req)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}

	product, err := h.service.UpdateProduct(r.Context(), userID, productID, usecase.SellerProductInput(input))
	if err != nil {
		writeDomainError(w, r, err)
		return
	}
	response.JSON(w, http.StatusOK, product)
}

func (h *SellerHandler) ProductUpdateStock(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	productID, err := parseUUIDParam("id", r)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}

	var req dto.AdminProductStockRequest
	if err := decodeAndValidate(r, &req, h.validate); err != nil {
		writeDomainError(w, r, err)
		return
	}

	product, err := h.service.UpdateProductStock(r.Context(), userID, productID, req.StockQty)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}
	response.JSON(w, http.StatusOK, product)
}

func (h *SellerHandler) ProductDelete(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	productID, err := parseUUIDParam("id", r)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}

	product, err := h.service.DeleteProduct(r.Context(), userID, productID)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"deleted": true,
		"product": product,
	})
}

func (h *SellerHandler) OrdersList(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, r, domain.ErrUnauthorized)
		return
	}

	items, err := h.service.ListOrders(
		r.Context(),
		userID,
		parseIntWithDefault(r.URL.Query().Get("page"), 1),
		parseIntWithDefault(r.URL.Query().Get("limit"), 20),
	)
	if err != nil {
		writeDomainError(w, r, err)
		return
	}

	response.JSON(w, http.StatusOK, items)
}
