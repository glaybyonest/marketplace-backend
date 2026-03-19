package usecase

import (
	"context"
	"net/mail"
	"strings"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/observability"

	"github.com/google/uuid"
)

type SellerProfileRepository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (domain.SellerProfile, error)
	Upsert(ctx context.Context, input SellerProfileWriteInput) (domain.SellerProfile, error)
	Metrics(ctx context.Context, userID uuid.UUID, lowStockThreshold int) (domain.SellerMetrics, error)
	ListLowStockProducts(ctx context.Context, userID uuid.UUID, threshold, limit int) ([]domain.Product, error)
	ListOrders(ctx context.Context, userID uuid.UUID, page, limit int) (domain.PageResult[domain.SellerOrderSummary], error)
}

type SellerCategoryRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (domain.Category, error)
}

type SellerProductRepository interface {
	List(ctx context.Context, filter domain.ProductFilter) (domain.PageResult[domain.Product], error)
	GetByIDAny(ctx context.Context, id uuid.UUID) (domain.Product, error)
	Create(ctx context.Context, input ProductWriteInput) (domain.Product, error)
	Update(ctx context.Context, input ProductWriteInput) (domain.Product, error)
	SetActive(ctx context.Context, id uuid.UUID, isActive bool) (domain.Product, error)
	UpdateStock(ctx context.Context, id uuid.UUID, stockQty int) (domain.Product, error)
}

type SellerUserRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (domain.User, error)
	UpdateRole(ctx context.Context, id uuid.UUID, role domain.UserRole) (domain.User, error)
}

type SellerAuditLogger interface {
	Record(ctx context.Context, entry observability.AuditEntry) error
}

type SellerProfileInput struct {
	StoreName    string
	StoreSlug    string
	LegalName    string
	Description  string
	LogoURL      string
	BannerURL    string
	SupportEmail string
	SupportPhone string
	City         string
	Status       domain.SellerStatus
}

type SellerProfileWriteInput struct {
	UserID       uuid.UUID
	StoreName    string
	StoreSlug    string
	LegalName    string
	Description  string
	LogoURL      string
	BannerURL    string
	SupportEmail string
	SupportPhone string
	City         string
	Status       domain.SellerStatus
}

type SellerProductInput = AdminProductInput

type SellerService struct {
	profiles   SellerProfileRepository
	categories SellerCategoryRepository
	products   SellerProductRepository
	users      SellerUserRepository
	audit      SellerAuditLogger
}

func NewSellerService(
	profiles SellerProfileRepository,
	categories SellerCategoryRepository,
	products SellerProductRepository,
	users SellerUserRepository,
	audit SellerAuditLogger,
) *SellerService {
	return &SellerService{
		profiles:   profiles,
		categories: categories,
		products:   products,
		users:      users,
		audit:      audit,
	}
}

func (s *SellerService) GetProfile(ctx context.Context, userID uuid.UUID) (domain.SellerProfile, error) {
	if userID == uuid.Nil {
		return domain.SellerProfile{}, domain.ErrUnauthorized
	}
	return s.profiles.GetByUserID(ctx, userID)
}

func (s *SellerService) UpsertProfile(ctx context.Context, userID uuid.UUID, input SellerProfileInput) (domain.SellerProfile, error) {
	if userID == uuid.Nil {
		return domain.SellerProfile{}, domain.ErrUnauthorized
	}

	currentUser, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return domain.SellerProfile{}, err
	}
	if !currentUser.IsActive {
		return domain.SellerProfile{}, domain.ErrInactiveUser
	}

	writeInput, err := normalizeSellerProfileInput(userID, input)
	if err != nil {
		return domain.SellerProfile{}, err
	}

	profile, err := s.profiles.Upsert(ctx, writeInput)
	if err != nil {
		return domain.SellerProfile{}, err
	}

	if currentUser.Role == domain.UserRoleCustomer {
		if _, err := s.users.UpdateRole(ctx, userID, domain.UserRoleSeller); err != nil {
			return domain.SellerProfile{}, err
		}
	}

	s.recordAudit(ctx, observability.AuditEntry{
		ActorUserID: ptrUUID(userID),
		Action:      "seller.profile_upserted",
		EntityType:  "seller_profile",
		EntityID:    ptrUUID(userID),
		Metadata:    sellerProfileAuditMetadata(profile),
	})

	return profile, nil
}

func (s *SellerService) Dashboard(ctx context.Context, userID uuid.UUID) (domain.SellerDashboard, error) {
	if userID == uuid.Nil {
		return domain.SellerDashboard{}, domain.ErrUnauthorized
	}

	profile, err := s.profiles.GetByUserID(ctx, userID)
	if err != nil {
		return domain.SellerDashboard{}, err
	}

	metrics, err := s.profiles.Metrics(ctx, userID, 10)
	if err != nil {
		return domain.SellerDashboard{}, err
	}

	recentProducts, err := s.products.List(ctx, domain.ProductFilter{
		SellerID:        &userID,
		IncludeInactive: true,
		Page:            1,
		Limit:           4,
		Sort:            domain.SortNew,
	})
	if err != nil {
		return domain.SellerDashboard{}, err
	}

	lowStock, err := s.profiles.ListLowStockProducts(ctx, userID, 10, 4)
	if err != nil {
		return domain.SellerDashboard{}, err
	}

	recentOrders, err := s.profiles.ListOrders(ctx, userID, 1, 5)
	if err != nil {
		return domain.SellerDashboard{}, err
	}

	return domain.SellerDashboard{
		Profile:        profile,
		Metrics:        metrics,
		RecentProducts: recentProducts.Items,
		LowStock:       lowStock,
		RecentOrders:   recentOrders.Items,
	}, nil
}

func (s *SellerService) ListProducts(ctx context.Context, userID uuid.UUID, filter domain.ProductFilter) (domain.PageResult[domain.Product], error) {
	if userID == uuid.Nil {
		return domain.PageResult[domain.Product]{}, domain.ErrUnauthorized
	}

	filter.SellerID = &userID
	filter.IncludeInactive = true
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}

	filter.Query = strings.TrimSpace(filter.Query)
	filter.Sort = strings.TrimSpace(filter.Sort)
	if filter.Sort == "" {
		filter.Sort = domain.SortNew
	}

	switch filter.Sort {
	case domain.SortNew, domain.SortPriceAsc, domain.SortPriceDesc:
	default:
		return domain.PageResult[domain.Product]{}, domain.ErrInvalidInput
	}

	if filter.MinPrice != nil && *filter.MinPrice < 0 {
		return domain.PageResult[domain.Product]{}, domain.ErrInvalidInput
	}
	if filter.MaxPrice != nil && *filter.MaxPrice < 0 {
		return domain.PageResult[domain.Product]{}, domain.ErrInvalidInput
	}
	if filter.MinPrice != nil && filter.MaxPrice != nil && *filter.MinPrice > *filter.MaxPrice {
		return domain.PageResult[domain.Product]{}, domain.ErrInvalidInput
	}

	return s.products.List(ctx, filter)
}

func (s *SellerService) CreateProduct(ctx context.Context, userID uuid.UUID, input SellerProductInput) (domain.Product, error) {
	if userID == uuid.Nil {
		return domain.Product{}, domain.ErrUnauthorized
	}
	if _, err := s.profiles.GetByUserID(ctx, userID); err != nil {
		return domain.Product{}, err
	}

	writeInput, err := buildProductWriteInput(ctx, s.categories, domain.Product{}, AdminProductInput(input), &userID)
	if err != nil {
		return domain.Product{}, err
	}

	product, err := s.products.Create(ctx, writeInput)
	if err != nil {
		return domain.Product{}, err
	}

	s.recordAudit(ctx, observability.AuditEntry{
		ActorUserID: ptrUUID(userID),
		Action:      "seller.product_created",
		EntityType:  "product",
		EntityID:    ptrUUID(product.ID),
		Metadata:    productAuditMetadata(product),
	})

	return product, nil
}

func (s *SellerService) UpdateProduct(ctx context.Context, userID, productID uuid.UUID, input SellerProductInput) (domain.Product, error) {
	if userID == uuid.Nil {
		return domain.Product{}, domain.ErrUnauthorized
	}
	if productID == uuid.Nil {
		return domain.Product{}, domain.ErrInvalidInput
	}

	current, err := s.products.GetByIDAny(ctx, productID)
	if err != nil {
		return domain.Product{}, err
	}
	if !ownsProduct(current, userID) {
		return domain.Product{}, domain.ErrForbidden
	}

	writeInput, err := buildProductWriteInput(ctx, s.categories, current, AdminProductInput(input), &userID)
	if err != nil {
		return domain.Product{}, err
	}

	product, err := s.products.Update(ctx, writeInput)
	if err != nil {
		return domain.Product{}, err
	}

	s.recordAudit(ctx, observability.AuditEntry{
		ActorUserID: ptrUUID(userID),
		Action:      "seller.product_updated",
		EntityType:  "product",
		EntityID:    ptrUUID(product.ID),
		Metadata: map[string]any{
			"before": productAuditMetadata(current),
			"after":  productAuditMetadata(product),
		},
	})

	return product, nil
}

func (s *SellerService) UpdateProductStock(ctx context.Context, userID, productID uuid.UUID, stockQty int) (domain.Product, error) {
	if userID == uuid.Nil {
		return domain.Product{}, domain.ErrUnauthorized
	}
	if productID == uuid.Nil || stockQty < 0 {
		return domain.Product{}, domain.ErrInvalidInput
	}

	current, err := s.products.GetByIDAny(ctx, productID)
	if err != nil {
		return domain.Product{}, err
	}
	if !ownsProduct(current, userID) {
		return domain.Product{}, domain.ErrForbidden
	}

	product, err := s.products.UpdateStock(ctx, productID, stockQty)
	if err != nil {
		return domain.Product{}, err
	}

	s.recordAudit(ctx, observability.AuditEntry{
		ActorUserID: ptrUUID(userID),
		Action:      "seller.product_stock_updated",
		EntityType:  "product",
		EntityID:    ptrUUID(product.ID),
		Metadata: map[string]any{
			"before_stock_qty": current.StockQty,
			"after_stock_qty":  product.StockQty,
		},
	})

	return product, nil
}

func (s *SellerService) DeleteProduct(ctx context.Context, userID, productID uuid.UUID) (domain.Product, error) {
	if userID == uuid.Nil {
		return domain.Product{}, domain.ErrUnauthorized
	}
	if productID == uuid.Nil {
		return domain.Product{}, domain.ErrInvalidInput
	}

	current, err := s.products.GetByIDAny(ctx, productID)
	if err != nil {
		return domain.Product{}, err
	}
	if !ownsProduct(current, userID) {
		return domain.Product{}, domain.ErrForbidden
	}

	product, err := s.products.SetActive(ctx, productID, false)
	if err != nil {
		return domain.Product{}, err
	}

	s.recordAudit(ctx, observability.AuditEntry{
		ActorUserID: ptrUUID(userID),
		Action:      "seller.product_archived",
		EntityType:  "product",
		EntityID:    ptrUUID(product.ID),
		Metadata: map[string]any{
			"before": productAuditMetadata(current),
			"after":  productAuditMetadata(product),
		},
	})

	return product, nil
}

func (s *SellerService) ListOrders(ctx context.Context, userID uuid.UUID, page, limit int) (domain.PageResult[domain.SellerOrderSummary], error) {
	if userID == uuid.Nil {
		return domain.PageResult[domain.SellerOrderSummary]{}, domain.ErrUnauthorized
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

	return s.profiles.ListOrders(ctx, userID, page, limit)
}

func (s *SellerService) recordAudit(ctx context.Context, entry observability.AuditEntry) {
	if s.audit == nil {
		return
	}
	_ = s.audit.Record(ctx, entry)
}

func ownsProduct(product domain.Product, userID uuid.UUID) bool {
	return product.SellerID != nil && *product.SellerID == userID
}

func normalizeSellerProfileInput(userID uuid.UUID, input SellerProfileInput) (SellerProfileWriteInput, error) {
	storeName := strings.TrimSpace(input.StoreName)
	if storeName == "" || len(storeName) > 160 {
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	storeSlug := normalizeSlug(input.StoreSlug)
	if storeSlug == "" {
		storeSlug = normalizeSlug(storeName)
	}
	if storeSlug == "" || len(storeSlug) > 160 {
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	legalName := strings.TrimSpace(input.LegalName)
	if len(legalName) > 200 {
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	description := strings.TrimSpace(input.Description)
	if len(description) > 2000 {
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	logoURL := strings.TrimSpace(input.LogoURL)
	if len(logoURL) > 2048 {
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	bannerURL := strings.TrimSpace(input.BannerURL)
	if len(bannerURL) > 2048 {
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	supportEmail, err := normalizeOptionalEmail(input.SupportEmail)
	if err != nil {
		return SellerProfileWriteInput{}, err
	}

	supportPhone := strings.TrimSpace(input.SupportPhone)
	if len(supportPhone) > 32 {
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	city := strings.TrimSpace(input.City)
	if len(city) > 120 {
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	status := input.Status
	if status == "" {
		status = domain.SellerStatusActive
	}
	switch status {
	case domain.SellerStatusPending, domain.SellerStatusActive, domain.SellerStatusPaused:
	default:
		return SellerProfileWriteInput{}, domain.ErrInvalidInput
	}

	return SellerProfileWriteInput{
		UserID:       userID,
		StoreName:    storeName,
		StoreSlug:    storeSlug,
		LegalName:    legalName,
		Description:  description,
		LogoURL:      logoURL,
		BannerURL:    bannerURL,
		SupportEmail: supportEmail,
		SupportPhone: supportPhone,
		City:         city,
		Status:       status,
	}, nil
}

func normalizeOptionalEmail(value string) (string, error) {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return "", nil
	}
	if _, err := mail.ParseAddress(value); err != nil {
		return "", domain.ErrInvalidInput
	}
	return value, nil
}

func sellerProfileAuditMetadata(profile domain.SellerProfile) map[string]any {
	return map[string]any{
		"store_name":    profile.StoreName,
		"store_slug":    profile.StoreSlug,
		"support_email": profile.SupportEmail,
		"support_phone": profile.SupportPhone,
		"city":          profile.City,
		"status":        profile.Status,
	}
}
