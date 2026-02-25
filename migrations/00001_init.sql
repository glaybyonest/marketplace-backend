-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	full_name TEXT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

CREATE TABLE IF NOT EXISTS user_sessions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	refresh_token_hash TEXT NOT NULL UNIQUE,
	user_agent TEXT NULL,
	ip INET NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	expires_at TIMESTAMPTZ NOT NULL,
	revoked_at TIMESTAMPTZ NULL,
	rotated_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked_at ON user_sessions(revoked_at);

CREATE TABLE IF NOT EXISTS categories (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	parent_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
	name TEXT NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT categories_name_not_empty CHECK (BTRIM(name) <> '')
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

CREATE TABLE IF NOT EXISTS products (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
	name TEXT NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	description TEXT NULL,
	price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
	currency CHAR(3) NOT NULL DEFAULT 'RUB',
	sku TEXT NOT NULL UNIQUE,
	stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT products_name_not_empty CHECK (BTRIM(name) <> '')
);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

CREATE TABLE IF NOT EXISTS favorites (
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS places (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	address_text TEXT NOT NULL,
	lat DOUBLE PRECISION NULL,
	lon DOUBLE PRECISION NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_places_user_id ON places(user_id);

CREATE TABLE IF NOT EXISTS user_product_events (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	event_type TEXT NOT NULL CHECK (event_type IN ('view', 'favorite_add')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_product_events_user_id ON user_product_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_events_product_id ON user_product_events(product_id);
CREATE INDEX IF NOT EXISTS idx_user_product_events_created_at ON user_product_events(created_at);

CREATE TRIGGER trg_users_updated_at
	BEFORE UPDATE ON users
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_updated_at
	BEFORE UPDATE ON categories
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
	BEFORE UPDATE ON products
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_places_updated_at
	BEFORE UPDATE ON places
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS trg_places_updated_at ON places;
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;

DROP TABLE IF EXISTS user_product_events;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;

DROP FUNCTION IF EXISTS set_updated_at;
-- +goose StatementEnd
