-- 029_template_performance.sql
CREATE TABLE IF NOT EXISTS template_performance (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  template_id text NOT NULL,
  template_version text NOT NULL,
  platform text NOT NULL,
  organization_id text,
  channel text,
  total_posts integer DEFAULT 0,
  avg_impressions numeric DEFAULT 0.0,
  avg_clicks numeric DEFAULT 0.0,
  avg_reactions numeric DEFAULT 0.0,
  avg_comments numeric DEFAULT 0.0,
  avg_shares numeric DEFAULT 0.0,
  avg_ctr numeric DEFAULT 0.0,
  performance_score numeric DEFAULT 0.0,
  sample_size integer DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, template_version, platform, organization_id, channel)
);

-- Index for performance queries
CREATE INDEX IF NOT EXISTS idx_template_performance_template ON template_performance(template_id, template_version);
CREATE INDEX IF NOT EXISTS idx_template_performance_org ON template_performance(organization_id, channel);
CREATE INDEX IF NOT EXISTS idx_template_performance_score ON template_performance(performance_score DESC);





