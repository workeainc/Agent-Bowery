CREATE TABLE IF NOT EXISTS prompt_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  channel text NOT NULL,
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  template text NOT NULL,
  output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, version, channel)
);


-- Brand rules per organization
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

-- Quality policies per organization and channel
CREATE TABLE IF NOT EXISTS quality_policies (
  organization_id text NOT NULL,
  channel text NOT NULL,
  min_readability numeric,
  max_similarity numeric,
  min_fact_supported_ratio numeric,
  toxicity_blocklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  language text,
  max_length integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, channel)
);


