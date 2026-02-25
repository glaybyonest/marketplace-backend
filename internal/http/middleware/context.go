package middleware

import (
	"context"

	"github.com/google/uuid"
)

type authContextKey string

const (
	userIDKey authContextKey = "auth_user_id"
	emailKey  authContextKey = "auth_email"
)

func WithAuth(ctx context.Context, userID uuid.UUID, email string) context.Context {
	ctx = context.WithValue(ctx, userIDKey, userID)
	ctx = context.WithValue(ctx, emailKey, email)
	return ctx
}

func UserID(ctx context.Context) (uuid.UUID, bool) {
	value, ok := ctx.Value(userIDKey).(uuid.UUID)
	return value, ok
}

func Email(ctx context.Context) (string, bool) {
	value, ok := ctx.Value(emailKey).(string)
	return value, ok
}
