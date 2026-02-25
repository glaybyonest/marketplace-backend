package usecase

import (
	"context"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/security"

	"github.com/google/uuid"
)

type AuthUserRepository interface {
	Create(ctx context.Context, input CreateUserInput) (domain.User, error)
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.User, error)
}

type AuthSessionRepository interface {
	Create(ctx context.Context, input CreateSessionInput) (domain.UserSession, error)
	GetByRefreshTokenHash(ctx context.Context, tokenHash string) (domain.UserSession, error)
	Rotate(ctx context.Context, oldSessionID uuid.UUID, oldTokenHash string, rotatedAt time.Time, newSession CreateSessionInput) error
	RevokeByRefreshTokenHash(ctx context.Context, userID uuid.UUID, tokenHash string, revokedAt time.Time) (bool, error)
}

type JWTProvider interface {
	Generate(userID uuid.UUID, email string) (token string, expiresAt time.Time, err error)
}

type PasswordProvider interface {
	Hash(password string) (string, error)
	Compare(hash, password string) bool
}

type CreateUserInput struct {
	Email        string
	PasswordHash string
	FullName     *string
}

type CreateSessionInput struct {
	UserID           uuid.UUID
	RefreshTokenHash string
	UserAgent        string
	IP               string
	ExpiresAt        time.Time
}

type RegisterInput struct {
	Email     string
	Password  string
	FullName  string
	UserAgent string
	IP        string
}

type LoginInput struct {
	Email     string
	Password  string
	UserAgent string
	IP        string
}

type RefreshInput struct {
	RefreshToken string
	UserAgent    string
	IP           string
}

type LogoutInput struct {
	UserID       uuid.UUID
	RefreshToken string
}

type AuthService struct {
	users      AuthUserRepository
	sessions   AuthSessionRepository
	jwt        JWTProvider
	passwords  PasswordProvider
	refreshTTL time.Duration
	now        func() time.Time
}

func NewAuthService(
	users AuthUserRepository,
	sessions AuthSessionRepository,
	jwt JWTProvider,
	passwords PasswordProvider,
	refreshTTL time.Duration,
) *AuthService {
	return &AuthService{
		users:      users,
		sessions:   sessions,
		jwt:        jwt,
		passwords:  passwords,
		refreshTTL: refreshTTL,
		now: func() time.Time {
			return time.Now().UTC()
		},
	}
}

func (s *AuthService) Register(ctx context.Context, input RegisterInput) (domain.User, domain.TokenPair, error) {
	var zeroPair domain.TokenPair

	email, err := normalizeEmail(input.Email)
	if err != nil {
		return domain.User{}, zeroPair, err
	}
	if !isStrongPassword(input.Password) {
		return domain.User{}, zeroPair, domain.ErrInvalidInput
	}

	fullName := normalizeOptionalString(input.FullName)
	passwordHash, err := s.passwords.Hash(input.Password)
	if err != nil {
		return domain.User{}, zeroPair, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.users.Create(ctx, CreateUserInput{
		Email:        email,
		PasswordHash: passwordHash,
		FullName:     fullName,
	})
	if err != nil {
		return domain.User{}, zeroPair, err
	}

	tokens, err := s.issueTokens(ctx, user, input.UserAgent, input.IP)
	if err != nil {
		return domain.User{}, zeroPair, err
	}

	return user, tokens, nil
}

func (s *AuthService) Login(ctx context.Context, input LoginInput) (domain.User, domain.TokenPair, error) {
	var zeroPair domain.TokenPair
	email, err := normalizeEmail(input.Email)
	if err != nil {
		return domain.User{}, zeroPair, domain.ErrUnauthorized
	}

	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		if err == domain.ErrNotFound {
			return domain.User{}, zeroPair, domain.ErrUnauthorized
		}
		return domain.User{}, zeroPair, err
	}
	if !user.IsActive {
		return domain.User{}, zeroPair, domain.ErrInactiveUser
	}
	if !s.passwords.Compare(user.PasswordHash, input.Password) {
		return domain.User{}, zeroPair, domain.ErrUnauthorized
	}

	tokens, err := s.issueTokens(ctx, user, input.UserAgent, input.IP)
	if err != nil {
		return domain.User{}, zeroPair, err
	}

	return user, tokens, nil
}

func (s *AuthService) Refresh(ctx context.Context, input RefreshInput) (domain.TokenPair, error) {
	refreshToken := strings.TrimSpace(input.RefreshToken)
	if refreshToken == "" {
		return domain.TokenPair{}, domain.ErrUnauthorized
	}

	now := s.now()
	tokenHash := security.HashToken(refreshToken)

	session, err := s.sessions.GetByRefreshTokenHash(ctx, tokenHash)
	if err != nil {
		if err == domain.ErrNotFound {
			return domain.TokenPair{}, domain.ErrUnauthorized
		}
		return domain.TokenPair{}, err
	}
	if session.RevokedAt != nil {
		return domain.TokenPair{}, domain.ErrSessionClosed
	}
	if session.RotatedAt != nil {
		return domain.TokenPair{}, domain.ErrTokenReused
	}
	if now.After(session.ExpiresAt) {
		_, _ = s.sessions.RevokeByRefreshTokenHash(ctx, session.UserID, tokenHash, now)
		return domain.TokenPair{}, domain.ErrUnauthorized
	}

	user, err := s.users.GetByID(ctx, session.UserID)
	if err != nil {
		if err == domain.ErrNotFound {
			return domain.TokenPair{}, domain.ErrUnauthorized
		}
		return domain.TokenPair{}, err
	}
	if !user.IsActive {
		return domain.TokenPair{}, domain.ErrInactiveUser
	}

	newRefreshToken, err := security.GenerateRefreshToken()
	if err != nil {
		return domain.TokenPair{}, fmt.Errorf("generate refresh token: %w", err)
	}

	if err := s.sessions.Rotate(ctx, session.ID, tokenHash, now, CreateSessionInput{
		UserID:           user.ID,
		RefreshTokenHash: security.HashToken(newRefreshToken),
		UserAgent:        normalizeUserAgent(input.UserAgent),
		IP:               normalizeIP(input.IP),
		ExpiresAt:        now.Add(s.refreshTTL),
	}); err != nil {
		return domain.TokenPair{}, err
	}

	accessToken, accessExp, err := s.jwt.Generate(user.ID, user.Email)
	if err != nil {
		return domain.TokenPair{}, fmt.Errorf("generate access token: %w", err)
	}

	return domain.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(accessExp.Sub(now).Seconds()),
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, input LogoutInput) error {
	if input.UserID == uuid.Nil || strings.TrimSpace(input.RefreshToken) == "" {
		return domain.ErrUnauthorized
	}

	revoked, err := s.sessions.RevokeByRefreshTokenHash(
		ctx,
		input.UserID,
		security.HashToken(strings.TrimSpace(input.RefreshToken)),
		s.now(),
	)
	if err != nil {
		return err
	}
	if !revoked {
		return domain.ErrUnauthorized
	}
	return nil
}

func (s *AuthService) Me(ctx context.Context, userID uuid.UUID) (domain.User, error) {
	if userID == uuid.Nil {
		return domain.User{}, domain.ErrUnauthorized
	}
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return domain.User{}, err
	}
	if !user.IsActive {
		return domain.User{}, domain.ErrInactiveUser
	}
	return user, nil
}

func (s *AuthService) issueTokens(ctx context.Context, user domain.User, userAgent, ip string) (domain.TokenPair, error) {
	now := s.now()

	accessToken, accessExp, err := s.jwt.Generate(user.ID, user.Email)
	if err != nil {
		return domain.TokenPair{}, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := security.GenerateRefreshToken()
	if err != nil {
		return domain.TokenPair{}, fmt.Errorf("generate refresh token: %w", err)
	}

	_, err = s.sessions.Create(ctx, CreateSessionInput{
		UserID:           user.ID,
		RefreshTokenHash: security.HashToken(refreshToken),
		UserAgent:        normalizeUserAgent(userAgent),
		IP:               normalizeIP(ip),
		ExpiresAt:        now.Add(s.refreshTTL),
	})
	if err != nil {
		return domain.TokenPair{}, err
	}

	return domain.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(accessExp.Sub(now).Seconds()),
	}, nil
}

func normalizeEmail(email string) (string, error) {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return "", domain.ErrInvalidInput
	}
	if _, err := mail.ParseAddress(normalized); err != nil {
		return "", domain.ErrInvalidInput
	}
	return normalized, nil
}

func isStrongPassword(password string) bool {
	if len(password) < 8 || len(password) > 72 {
		return false
	}

	hasLetter := false
	hasDigit := false
	for _, r := range password {
		switch {
		case r >= '0' && r <= '9':
			hasDigit = true
		case (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z'):
			hasLetter = true
		}
	}
	return hasLetter && hasDigit
}

func normalizeOptionalString(value string) *string {
	v := strings.TrimSpace(value)
	if v == "" {
		return nil
	}
	return &v
}

func normalizeUserAgent(ua string) string {
	return strings.TrimSpace(ua)
}

func normalizeIP(ip string) string {
	return strings.TrimSpace(ip)
}
