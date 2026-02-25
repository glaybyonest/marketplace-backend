package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EventRepository struct {
	db *pgxpool.Pool
}

func NewEventRepository(db *pgxpool.Pool) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) Create(ctx context.Context, userID, productID uuid.UUID, eventType string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO user_product_events (user_id, product_id, event_type)
		VALUES ($1, $2, $3)
	`, userID, productID, eventType)
	return mapError(err)
}
