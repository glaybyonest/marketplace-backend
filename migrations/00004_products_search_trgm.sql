-- +goose Up
-- +goose StatementBegin
DO $$
BEGIN
	CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION
	WHEN insufficient_privilege THEN
		RAISE NOTICE 'Skipping pg_trgm extension creation due insufficient privilege';
END;
$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
		EXECUTE 'CREATE INDEX IF NOT EXISTS idx_products_name_trgm_active ON products USING GIN (LOWER(name) gin_trgm_ops) WHERE is_active = TRUE';
	ELSE
		RAISE NOTICE 'Skipping idx_products_name_trgm_active because pg_trgm is unavailable';
	END IF;
END;
$$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_products_name_trgm_active;
-- +goose StatementEnd
