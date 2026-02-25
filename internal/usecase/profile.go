package usecase

import (
	"context"
	"strings"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
)

type ProfileUserRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (domain.User, error)
	UpdateFullName(ctx context.Context, id uuid.UUID, fullName *string) (domain.User, error)
}

type ProfileService struct {
	users ProfileUserRepository
}

func NewProfileService(users ProfileUserRepository) *ProfileService {
	return &ProfileService{users: users}
}

func (s *ProfileService) Get(ctx context.Context, userID uuid.UUID) (domain.User, error) {
	if userID == uuid.Nil {
		return domain.User{}, domain.ErrUnauthorized
	}
	return s.users.GetByID(ctx, userID)
}

func (s *ProfileService) Update(ctx context.Context, userID uuid.UUID, fullName *string) (domain.User, error) {
	if userID == uuid.Nil {
		return domain.User{}, domain.ErrUnauthorized
	}

	if fullName == nil {
		return s.users.GetByID(ctx, userID)
	}

	value := strings.TrimSpace(*fullName)
	if len(value) > 120 {
		return domain.User{}, domain.ErrInvalidInput
	}
	if value == "" {
		return s.users.UpdateFullName(ctx, userID, nil)
	}

	return s.users.UpdateFullName(ctx, userID, &value)
}
