-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
	ADD CONSTRAINT users_full_name_max_len
	CHECK (full_name IS NULL OR char_length(full_name) <= 120)
	NOT VALID;
ALTER TABLE users VALIDATE CONSTRAINT users_full_name_max_len;

ALTER TABLE user_sessions
	ADD CONSTRAINT user_sessions_expires_after_created
	CHECK (expires_at > created_at)
	NOT VALID;
ALTER TABLE user_sessions VALIDATE CONSTRAINT user_sessions_expires_after_created;

ALTER TABLE user_sessions
	ADD CONSTRAINT user_sessions_revoked_after_created
	CHECK (revoked_at IS NULL OR revoked_at >= created_at)
	NOT VALID;
ALTER TABLE user_sessions VALIDATE CONSTRAINT user_sessions_revoked_after_created;

ALTER TABLE user_sessions
	ADD CONSTRAINT user_sessions_rotated_after_created
	CHECK (rotated_at IS NULL OR rotated_at >= created_at)
	NOT VALID;
ALTER TABLE user_sessions VALIDATE CONSTRAINT user_sessions_rotated_after_created;

ALTER TABLE categories
	ADD CONSTRAINT categories_slug_not_empty
	CHECK (BTRIM(slug) <> '')
	NOT VALID;
ALTER TABLE categories VALIDATE CONSTRAINT categories_slug_not_empty;

ALTER TABLE categories
	ADD CONSTRAINT categories_slug_lowercase
	CHECK (slug = LOWER(slug))
	NOT VALID;
ALTER TABLE categories VALIDATE CONSTRAINT categories_slug_lowercase;

ALTER TABLE products
	ADD CONSTRAINT products_slug_not_empty
	CHECK (BTRIM(slug) <> '')
	NOT VALID;
ALTER TABLE products VALIDATE CONSTRAINT products_slug_not_empty;

ALTER TABLE products
	ADD CONSTRAINT products_slug_lowercase
	CHECK (slug = LOWER(slug))
	NOT VALID;
ALTER TABLE products VALIDATE CONSTRAINT products_slug_lowercase;

ALTER TABLE products
	ADD CONSTRAINT products_sku_not_empty
	CHECK (BTRIM(sku) <> '')
	NOT VALID;
ALTER TABLE products VALIDATE CONSTRAINT products_sku_not_empty;

ALTER TABLE products
	ADD CONSTRAINT products_currency_uppercase_iso
	CHECK (currency::text ~ '^[A-Z]{3}$')
	NOT VALID;
ALTER TABLE products VALIDATE CONSTRAINT products_currency_uppercase_iso;

ALTER TABLE places
	ADD CONSTRAINT places_title_not_empty
	CHECK (BTRIM(title) <> '')
	NOT VALID;
ALTER TABLE places VALIDATE CONSTRAINT places_title_not_empty;

ALTER TABLE places
	ADD CONSTRAINT places_title_max_len
	CHECK (char_length(title) <= 120)
	NOT VALID;
ALTER TABLE places VALIDATE CONSTRAINT places_title_max_len;

ALTER TABLE places
	ADD CONSTRAINT places_address_not_empty
	CHECK (BTRIM(address_text) <> '')
	NOT VALID;
ALTER TABLE places VALIDATE CONSTRAINT places_address_not_empty;

ALTER TABLE places
	ADD CONSTRAINT places_address_max_len
	CHECK (char_length(address_text) <= 255)
	NOT VALID;
ALTER TABLE places VALIDATE CONSTRAINT places_address_max_len;

ALTER TABLE places
	ADD CONSTRAINT places_lat_range
	CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90))
	NOT VALID;
ALTER TABLE places VALIDATE CONSTRAINT places_lat_range;

ALTER TABLE places
	ADD CONSTRAINT places_lon_range
	CHECK (lon IS NULL OR (lon >= -180 AND lon <= 180))
	NOT VALID;
ALTER TABLE places VALIDATE CONSTRAINT places_lon_range;

CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_created_at ON favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_places_user_created_at ON places(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_active_created_at ON products(created_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active_category_created_at ON products(category_id, created_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active_price ON products(price) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_product_events_product_event_type ON user_product_events(product_id, event_type);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_user_product_events_product_event_type;
DROP INDEX IF EXISTS idx_products_active_price;
DROP INDEX IF EXISTS idx_products_active_category_created_at;
DROP INDEX IF EXISTS idx_products_active_created_at;
DROP INDEX IF EXISTS idx_places_user_created_at;
DROP INDEX IF EXISTS idx_favorites_user_created_at;
DROP INDEX IF EXISTS idx_favorites_product_id;

ALTER TABLE places DROP CONSTRAINT IF EXISTS places_lon_range;
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_lat_range;
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_address_max_len;
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_address_not_empty;
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_title_max_len;
ALTER TABLE places DROP CONSTRAINT IF EXISTS places_title_not_empty;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_currency_uppercase_iso;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_not_empty;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_lowercase;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_not_empty;

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_lowercase;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_not_empty;

ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_rotated_after_created;
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_revoked_after_created;
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_expires_after_created;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_full_name_max_len;
-- +goose StatementEnd
