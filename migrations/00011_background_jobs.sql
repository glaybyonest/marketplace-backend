-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS email_jobs (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	recipient TEXT NOT NULL,
	sender TEXT NOT NULL,
	subject TEXT NOT NULL,
	body_text TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending'
		CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
	attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
	max_attempts INT NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
	available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	locked_at TIMESTAMPTZ NULL,
	last_error TEXT NULL,
	sent_at TIMESTAMPTZ NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_jobs_status_available_at
	ON email_jobs (status, available_at, created_at);
CREATE INDEX IF NOT EXISTS idx_email_jobs_sent_at
	ON email_jobs (sent_at DESC);

CREATE TRIGGER trg_email_jobs_updated_at
	BEFORE UPDATE ON email_jobs
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS product_popularity_stats (
	product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
	favorite_count INT NOT NULL DEFAULT 0,
	favorite_event_count INT NOT NULL DEFAULT 0,
	view_count INT NOT NULL DEFAULT 0,
	score DOUBLE PRECISION NOT NULL DEFAULT 0,
	last_event_at TIMESTAMPTZ NULL,
	refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_popularity_stats_score
	ON product_popularity_stats (score DESC, last_event_at DESC);

CREATE TABLE IF NOT EXISTS user_recommendations (
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	rank INT NOT NULL CHECK (rank > 0),
	source TEXT NOT NULL CHECK (source IN ('favorite_category', 'popular')),
	refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (user_id, product_id),
	CONSTRAINT user_recommendations_unique_rank UNIQUE (user_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_rank
	ON user_recommendations (user_id, rank);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_refreshed_at
	ON user_recommendations (refreshed_at DESC);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_user_recommendations_refreshed_at;
DROP INDEX IF EXISTS idx_user_recommendations_user_rank;
DROP TABLE IF EXISTS user_recommendations;

DROP INDEX IF EXISTS idx_product_popularity_stats_score;
DROP TABLE IF EXISTS product_popularity_stats;

DROP TRIGGER IF EXISTS trg_email_jobs_updated_at ON email_jobs;
DROP INDEX IF EXISTS idx_email_jobs_sent_at;
DROP INDEX IF EXISTS idx_email_jobs_status_available_at;
DROP TABLE IF EXISTS email_jobs;
-- +goose StatementEnd
