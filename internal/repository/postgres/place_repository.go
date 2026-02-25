package postgres

import (
	"context"

	"marketplace-backend/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PlaceRepository struct {
	db *pgxpool.Pool
}

func NewPlaceRepository(db *pgxpool.Pool) *PlaceRepository {
	return &PlaceRepository{db: db}
}

func (r *PlaceRepository) Create(ctx context.Context, place domain.Place) (domain.Place, error) {
	const q = `
		INSERT INTO places (id, user_id, title, address_text, lat, lon)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, title, address_text, lat, lon, created_at, updated_at
	`

	var item domain.Place
	err := r.db.QueryRow(ctx, q, place.ID, place.UserID, place.Title, place.AddressText, place.Lat, place.Lon).Scan(
		&item.ID,
		&item.UserID,
		&item.Title,
		&item.AddressText,
		&item.Lat,
		&item.Lon,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return domain.Place{}, mapError(err)
	}
	return item, nil
}

func (r *PlaceRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Place, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, user_id, title, address_text, lat, lon, created_at, updated_at
		FROM places
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, mapError(err)
	}
	defer rows.Close()

	items := make([]domain.Place, 0)
	for rows.Next() {
		var place domain.Place
		if err := scanPlace(rows, &place); err != nil {
			return nil, mapError(err)
		}
		items = append(items, place)
	}
	if err := rows.Err(); err != nil {
		return nil, mapError(err)
	}
	return items, nil
}

func (r *PlaceRepository) GetByIDForUser(ctx context.Context, placeID, userID uuid.UUID) (domain.Place, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, user_id, title, address_text, lat, lon, created_at, updated_at
		FROM places
		WHERE id = $1 AND user_id = $2
	`, placeID, userID)

	var place domain.Place
	if err := scanPlace(row, &place); err != nil {
		return domain.Place{}, mapError(err)
	}
	return place, nil
}

func (r *PlaceRepository) Update(ctx context.Context, place domain.Place) (domain.Place, error) {
	const q = `
		UPDATE places
		SET title = $3, address_text = $4, lat = $5, lon = $6
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, title, address_text, lat, lon, created_at, updated_at
	`

	var updated domain.Place
	err := r.db.QueryRow(ctx, q, place.ID, place.UserID, place.Title, place.AddressText, place.Lat, place.Lon).Scan(
		&updated.ID,
		&updated.UserID,
		&updated.Title,
		&updated.AddressText,
		&updated.Lat,
		&updated.Lon,
		&updated.CreatedAt,
		&updated.UpdatedAt,
	)
	if err != nil {
		return domain.Place{}, mapError(err)
	}
	return updated, nil
}

func (r *PlaceRepository) Delete(ctx context.Context, placeID, userID uuid.UUID) (bool, error) {
	cmd, err := r.db.Exec(ctx, `
		DELETE FROM places
		WHERE id = $1 AND user_id = $2
	`, placeID, userID)
	if err != nil {
		return false, mapError(err)
	}
	return cmd.RowsAffected() > 0, nil
}

func scanPlace(row pgx.Row, place *domain.Place) error {
	return row.Scan(
		&place.ID,
		&place.UserID,
		&place.Title,
		&place.AddressText,
		&place.Lat,
		&place.Lon,
		&place.CreatedAt,
		&place.UpdatedAt,
	)
}
