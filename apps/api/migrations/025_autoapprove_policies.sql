-- 025_autoapprove_policies.sql
CREATE TABLE IF NOT EXISTS autoapprove_policies (
  organization_id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  min_confidence numeric NOT NULL DEFAULT 0.8,
  updated_at timestamptz NOT NULL DEFAULT now()
);



