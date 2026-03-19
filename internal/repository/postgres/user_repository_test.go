package postgres

import (
	"database/sql"
	"testing"
	"time"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

type rowStub struct {
	scanFn func(dest ...any) error
}

func (r rowStub) Scan(dest ...any) error {
	return r.scanFn(dest...)
}

func TestScanUserHandlesNullableFields(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	userID := uuid.New()

	row := rowStub{
		scanFn: func(dest ...any) error {
			*dest[0].(*uuid.UUID) = userID
			*dest[1].(*string) = "seller@example.com"
			*dest[2].(*sql.NullString) = sql.NullString{}
			*dest[3].(*string) = "hashed-password"
			*dest[4].(*sql.NullString) = sql.NullString{}
			*dest[5].(*domain.UserRole) = domain.UserRoleSeller
			*dest[6].(*time.Time) = now
			*dest[7].(*time.Time) = now
			*dest[8].(*bool) = true
			*dest[9].(**time.Time) = nil
			*dest[10].(*int) = 0
			*dest[11].(**time.Time) = nil
			*dest[12].(**time.Time) = nil
			return nil
		},
	}

	var user domain.User
	err := scanUser(row, &user)
	require.NoError(t, err)
	require.Equal(t, userID, user.ID)
	require.Equal(t, "seller@example.com", user.Email)
	require.Equal(t, "", user.Phone)
	require.Equal(t, "", user.FullName)
	require.Equal(t, domain.UserRoleSeller, user.Role)
	require.False(t, user.IsEmailVerified)
}
