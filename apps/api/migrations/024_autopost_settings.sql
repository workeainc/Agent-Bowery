-- 024_autopost_settings.sql
CREATE TABLE IF NOT EXISTS autopost_settings (
  organization_id text PRIMARY KEY,
  autopost_enabled boolean NOT NULL DEFAULT false,
  dry_run boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);


