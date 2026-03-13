-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
	ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;

UPDATE users
SET email_verified_at = created_at
WHERE email_verified_at IS NULL;

CREATE TABLE IF NOT EXISTS user_action_tokens (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
	token_hash TEXT NOT NULL UNIQUE,
	expires_at TIMESTAMPTZ NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	consumed_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_user_action_tokens_user_purpose ON user_action_tokens(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_user_action_tokens_expires_at ON user_action_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_action_tokens_consumed_at ON user_action_tokens(consumed_at);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_action_tokens;

ALTER TABLE users
	DROP COLUMN IF EXISTS email_verified_at;
-- +goose StatementEnd
