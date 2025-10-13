-- 022_brand_rules.sql
CREATE TABLE IF NOT EXISTS brand_rules (
  organization_id text PRIMARY KEY,
  tone jsonb NOT NULL DEFAULT '{}'::jsonb,
  dos jsonb NOT NULL DEFAULT '[]'::jsonb,
  donts jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_ctas jsonb NOT NULL DEFAULT '[]'::jsonb,
  handles jsonb NOT NULL DEFAULT '{}'::jsonb,
  hashtags jsonb NOT NULL DEFAULT '[]'::jsonb,
  restricted_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);


