package postgres

import (
	"errors"
	"unicode/utf8"

	"marketplace-backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func mapError(err error) error {
	if err == nil {
		return nil
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			return domain.ErrConflict
		case "23503":
			return domain.ErrNotFound
		case "23514", "22P02":
			return domain.ErrInvalidInput
		}
	}

	return err
}

func truncateText(value string, limit int) string {
	if limit <= 0 || len(value) <= limit {
		return value
	}

	if utf8.ValidString(value) {
		runes := []rune(value)
		if len(runes) <= limit {
			return value
		}
		return string(runes[:limit])
	}
	return value[:limit]
}
