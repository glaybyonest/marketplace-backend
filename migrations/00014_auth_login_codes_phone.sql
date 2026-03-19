-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
	ADD COLUMN IF NOT EXISTS phone TEXT NULL;

UPDATE users
SET phone = NULL
WHERE phone IS NOT NULL AND BTRIM(phone) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
	ON users (phone)
	WHERE phone IS NOT NULL;

ALTER TABLE user_action_tokens
	DROP CONSTRAINT IF EXISTS user_action_tokens_purpose_check;

ALTER TABLE user_action_tokens
	ADD CONSTRAINT user_action_tokens_purpose_check
	CHECK (purpose IN ('verify_email', 'reset_password', 'login_email_code', 'login_phone_code'));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM user_action_tokens
WHERE purpose IN ('login_email_code', 'login_phone_code');

ALTER TABLE user_action_tokens
	DROP CONSTRAINT IF EXISTS user_action_tokens_purpose_check;

ALTER TABLE user_action_tokens
	ADD CONSTRAINT user_action_tokens_purpose_check
	CHECK (purpose IN ('verify_email', 'reset_password'));

DROP INDEX IF EXISTS idx_users_phone_unique;

ALTER TABLE users
	DROP COLUMN IF EXISTS phone;
-- +goose StatementEnd
