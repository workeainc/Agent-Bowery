-- 023_quality_policies.sql
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


