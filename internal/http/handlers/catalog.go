package handlers

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/http/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CatalogService interface {
	ListCategoriesTree(ctx context.Context) ([]domain.CategoryNode, error)
	GetCategoryByID(ctx context.Context, id uuid.UUID) (domain.Category, error)
	GetCategoryBySlug(ctx context.Context, slug string) (domain.Category, error)
	ListProducts(ctx context.Context, filter domain.ProductFilter) (domain.PageResult[domain.Product], error)
	GetProductByID(ctx context.Context, id uuid.UUID) (domain.Product, error)
	GetProductBySlug(ctx context.Context, slug string) (domain.Product, error)
	TrackView(ctx context.Context, userID, productID uuid.UUID) error
}

type CatalogHandler struct {
	service CatalogService
}

func NewCatalogHandler(service CatalogService) *CatalogHandler {
	return &CatalogHandler{service: service}
}

func (h *CatalogHandler) CategoriesTree(w http.ResponseWriter, r *http.Request) {
	tree, err := h.service.ListCategoriesTree(r.Context())
	if err != nil {
		writeDomainError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, tree)
}

func (h *CatalogHandler) CategoryByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(strings.TrimSpace(chi.URLParam(r, "id")))
	if err != nil {
		writeDomainError(w, domain.ErrInvalidInput)
		return
	}

	item, err := h.service.GetCategoryByID(r.Context(), id)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, item)
}

func (h *CatalogHandler) CategoryBySlug(w http.ResponseWriter, r *http.Request) {
	item, err := h.service.GetCategoryBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, item)
}

func (h *CatalogHandler) ProductsList(w http.ResponseWriter, r *http.Request) {
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
			writeDomainError(w, domain.ErrInvalidInput)
			return
		}
		filter.CategoryID = &categoryID
	}

	result, err := h.service.ListProducts(r.Context(), filter)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *CatalogHandler) ProductByID(w http.ResponseWriter, r *http.Request) {
	productID, err := uuid.Parse(strings.TrimSpace(chi.URLParam(r, "id")))
	if err != nil {
		writeDomainError(w, domain.ErrInvalidInput)
		return
	}

	product, err := h.service.GetProductByID(r.Context(), productID)
	if err != nil {
		writeDomainError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, product)
}

func (h *CatalogHandler) ProductBySlug(w http.ResponseWriter, r *http.Request) {
	product, err := h.service.GetProductBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		writeDomainError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, product)
}

func parseIntWithDefault(value string, fallback int) int {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
