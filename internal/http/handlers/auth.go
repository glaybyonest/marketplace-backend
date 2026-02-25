package handlers

import (
	"context"
	"net/http"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/http/dto"
	httpmw "marketplace-backend/internal/http/middleware"
	"marketplace-backend/internal/http/response"
	"marketplace-backend/internal/usecase"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type AuthService interface {
	Register(ctx context.Context, input usecase.RegisterInput) (domain.User, domain.TokenPair, error)
	Login(ctx context.Context, input usecase.LoginInput) (domain.User, domain.TokenPair, error)
	Refresh(ctx context.Context, input usecase.RefreshInput) (domain.TokenPair, error)
	Logout(ctx context.Context, input usecase.LogoutInput) error
	Me(ctx context.Context, userID uuid.UUID) (domain.User, error)
}

type AuthHandler struct {
	service  AuthService
	validate *validator.Validate
}

func NewAuthHandler(service AuthService) *AuthHandler {
	return &AuthHandler{
		service:  service,
		validate: validator.New(validator.WithRequiredStructEnabled()),
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := decodeAndValidate(r, &req, h.validate); err != nil {
		writeDomainError(w, err)
		return
	}

	user, tokens, err := h.service.Register(r.Context(), usecase.RegisterInput{
		Email:     req.Email,
		Password:  req.Password,
		FullName:  req.FullName,
		UserAgent: r.UserAgent(),
		IP:        getClientIP(r),
	})
	if err != nil {
		writeDomainError(w, err)
		return
	}

	response.JSON(w, http.StatusCreated, map[string]any{
		"user":   user,
		"tokens": tokens,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := decodeAndValidate(r, &req, h.validate); err != nil {
		writeDomainError(w, err)
		return
	}

	user, tokens, err := h.service.Login(r.Context(), usecase.LoginInput{
		Email:     req.Email,
		Password:  req.Password,
		UserAgent: r.UserAgent(),
		IP:        getClientIP(r),
	})
	if err != nil {
		writeDomainError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"user":   user,
		"tokens": tokens,
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req dto.RefreshRequest
	if err := decodeAndValidate(r, &req, h.validate); err != nil {
		writeDomainError(w, err)
		return
	}

	tokens, err := h.service.Refresh(r.Context(), usecase.RefreshInput{
		RefreshToken: req.RefreshToken,
		UserAgent:    r.UserAgent(),
		IP:           getClientIP(r),
	})
	if err != nil {
		writeDomainError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, tokens)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, domain.ErrUnauthorized)
		return
	}

	var req dto.LogoutRequest
	if err := decodeAndValidate(r, &req, h.validate); err != nil {
		writeDomainError(w, err)
		return
	}

	if err := h.service.Logout(r.Context(), usecase.LogoutInput{
		UserID:       userID,
		RefreshToken: req.RefreshToken,
	}); err != nil {
		writeDomainError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]bool{"revoked": true})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpmw.UserID(r.Context())
	if !ok {
		writeDomainError(w, domain.ErrUnauthorized)
		return
	}

	user, err := h.service.Me(r.Context(), userID)
	if err != nil {
		writeDomainError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, user)
}
