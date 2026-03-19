package usecase

import (
	"context"
	"testing"
	"time"

	"marketplace-backend/internal/domain"
	"marketplace-backend/internal/observability"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type profileUserRepoMock struct {
	users map[uuid.UUID]domain.User
}

type profileAuditMock struct {
	entries []observability.AuditEntry
}

func (m *profileAuditMock) Record(ctx context.Context, entry observability.AuditEntry) error {
	m.entries = append(m.entries, entry)
	return nil
}

func (m *profileUserRepoMock) GetByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	user, ok := m.users[id]
	if !ok {
		return domain.User{}, domain.ErrNotFound
	}
	return user, nil
}

func (m *profileUserRepoMock) UpdateFullName(ctx context.Context, id uuid.UUID, fullName *string) (domain.User, error) {
	user, ok := m.users[id]
	if !ok {
		return domain.User{}, domain.ErrNotFound
	}
	if fullName == nil {
		user.FullName = ""
	} else {
		user.FullName = *fullName
	}
	user.UpdatedAt = time.Now().UTC()
	m.users[id] = user
	return user, nil
}

func (m *profileUserRepoMock) UpdatePhone(ctx context.Context, id uuid.UUID, phone *string) (domain.User, error) {
	user, ok := m.users[id]
	if !ok {
		return domain.User{}, domain.ErrNotFound
	}
	if phone == nil {
		user.Phone = ""
	} else {
		user.Phone = *phone
	}
	user.UpdatedAt = time.Now().UTC()
	m.users[id] = user
	return user, nil
}

func TestProfileService(t *testing.T) {
	userID := uuid.New()
	repo := &profileUserRepoMock{
		users: map[uuid.UUID]domain.User{
			userID: {
				ID:       userID,
				Email:    "profile@example.com",
				FullName: "User Name",
				IsActive: true,
			},
		},
	}
	audit := &profileAuditMock{}
	service := NewProfileService(repo, audit)

	t.Run("get success", func(t *testing.T) {
		user, err := service.Get(context.Background(), userID)
		require.NoError(t, err)
		assert.Equal(t, "profile@example.com", user.Email)
	})

	t.Run("get unauthorized", func(t *testing.T) {
		_, err := service.Get(context.Background(), uuid.Nil)
		require.Error(t, err)
		assert.ErrorIs(t, err, domain.ErrUnauthorized)
	})

	t.Run("update name and phone", func(t *testing.T) {
		fullName := "  Trimmed Name  "
		phone := "+7 (999) 123-45-67"

		user, err := service.Update(context.Background(), userID, &fullName, &phone)
		require.NoError(t, err)
		assert.Equal(t, "Trimmed Name", user.FullName)
		assert.Equal(t, "+79991234567", user.Phone)
	})

	t.Run("clear name and phone", func(t *testing.T) {
		fullName := "   "
		phone := " "

		user, err := service.Update(context.Background(), userID, &fullName, &phone)
		require.NoError(t, err)
		assert.Equal(t, "", user.FullName)
		assert.Equal(t, "", user.Phone)
	})

	t.Run("invalid phone rejected", func(t *testing.T) {
		phone := "12"

		_, err := service.Update(context.Background(), userID, nil, &phone)
		require.Error(t, err)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("too long name rejected", func(t *testing.T) {
		value := ""
		for i := 0; i < 121; i++ {
			value += "a"
		}

		_, err := service.Update(context.Background(), userID, &value, nil)
		require.Error(t, err)
		assert.ErrorIs(t, err, domain.ErrInvalidInput)
	})

	t.Run("no changes returns current user", func(t *testing.T) {
		user, err := service.Update(context.Background(), userID, nil, nil)
		require.NoError(t, err)
		assert.Equal(t, "profile@example.com", user.Email)
	})

	require.NotEmpty(t, audit.entries)
	assert.Equal(t, "profile.updated", audit.entries[len(audit.entries)-1].Action)
}
