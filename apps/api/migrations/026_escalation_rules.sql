-- 026_escalation_rules.sql
CREATE TABLE IF NOT EXISTS escalation_rules (
  organization_id text PRIMARY KEY,
  vip_accounts text[] NOT NULL DEFAULT '{}',
  risky_topics text[] NOT NULL DEFAULT '{}', -- treat as plain substrings; can expand to regex later
  max_toxicity numeric,
  max_similarity numeric,
  min_fact_supported_ratio numeric,
  blocklist text[] NOT NULL DEFAULT '{}',
  manual_channels text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);



