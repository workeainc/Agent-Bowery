-- Align tokens table scopes type and add index for social_account_id
-- Ensure scopes is TEXT (space-delimited) instead of array
ALTER TABLE tokens
  ALTER COLUMN scopes TYPE TEXT USING scopes::TEXT;

-- Add index for faster lookups by social_account_id
CREATE INDEX IF NOT EXISTS idx_tokens_social_account_id ON tokens (social_account_id);
