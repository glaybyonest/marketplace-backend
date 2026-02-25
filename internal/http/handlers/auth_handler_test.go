package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"marketplace-backend/internal/domain"
	httpmw "marketplace-backend/internal/http/middleware"
	"marketplace-backend/internal/usecase"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type authServiceStub struct {
	registerFn func(ctx context.Context, input usecase.RegisterInput) (domain.User, domain.TokenPair, error)
	loginFn    func(ctx context.Context, input usecase.LoginInput) (domain.User, domain.TokenPair, error)
	refreshFn  func(ctx context.Context, input usecase.RefreshInput) (domain.TokenPair, error)
	logoutFn   func(ctx context.Context, input usecase.LogoutInput) error
	meFn       func(ctx context.Context, userID uuid.UUID) (domain.User, error)
}

func (s *authServiceStub) Register(ctx context.Context, input usecase.RegisterInput) (domain.User, domain.TokenPair, error) {
	return s.registerFn(ctx, input)
}

func (s *authServiceStub) Login(ctx context.Context, input usecase.LoginInput) (domain.User, domain.TokenPair, error) {
	return s.loginFn(ctx, input)
}

func (s *authServiceStub) Refresh(ctx context.Context, input usecase.RefreshInput) (domain.TokenPair, error) {
	return s.refreshFn(ctx, input)
}

func (s *authServiceStub) Logout(ctx context.Context, input usecase.LogoutInput) error {
	return s.logoutFn(ctx, input)
}

func (s *authServiceStub) Me(ctx context.Context, userID uuid.UUID) (domain.User, error) {
	return s.meFn(ctx, userID)
}

func TestAuthHandler(t *testing.T) {
	userID := uuid.New()
	stub := &authServiceStub{
		registerFn: func(ctx context.Context, input usecase.RegisterInput) (domain.User, domain.TokenPair, error) {
			return domain.User{ID: userID, Email: input.Email}, domain.TokenPair{AccessToken: "a", RefreshToken: "r", TokenType: "Bearer"}, nil
		},
		loginFn: func(ctx context.Context, input usecase.LoginInput) (domain.User, domain.TokenPair, error) {
			return domain.User{ID: userID, Email: input.Email}, domain.TokenPair{AccessToken: "a", RefreshToken: "r", TokenType: "Bearer"}, nil
		},
		refreshFn: func(ctx context.Context, input usecase.RefreshInput) (domain.TokenPair, error) {
			return domain.TokenPair{AccessToken: "a2", RefreshToken: "r2", TokenType: "Bearer"}, nil
		},
		logoutFn: func(ctx context.Context, input usecase.LogoutInput) error { return nil },
		meFn: func(ctx context.Context, userID uuid.UUID) (domain.User, error) {
			return domain.User{ID: userID, Email: "me@example.com"}, nil
		},
	}
	handler := NewAuthHandler(stub)

	t.Run("register invalid payload", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/register", strings.NewReader(`{"email":"bad"}`))
		rec := httptest.NewRecorder()
		handler.Register(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("register success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/register", strings.NewReader(`{"email":"user@example.com","password":"StrongPass1","full_name":"User"}`))
		rec := httptest.NewRecorder()
		handler.Register(rec, req)
		require.Equal(t, http.StatusCreated, rec.Code)

		var payload map[string]any
		require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &payload))
		_, ok := payload["data"]
		assert.True(t, ok)
	})

	t.Run("login success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(`{"email":"user@example.com","password":"StrongPass1"}`))
		rec := httptest.NewRecorder()
		handler.Login(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("refresh invalid payload", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/refresh", strings.NewReader(`{"refresh_token":""}`))
		rec := httptest.NewRecorder()
		handler.Refresh(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("me unauthorized without context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/me", nil)
		rec := httptest.NewRecorder()
		handler.Me(rec, req)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})

	t.Run("me success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/me", nil)
		req = req.WithContext(httpmw.WithAuth(req.Context(), userID, "me@example.com"))
		rec := httptest.NewRecorder()
		handler.Me(rec, req)
		assert.Equal(t, http.StatusOK, rec.Code)
	})
}
