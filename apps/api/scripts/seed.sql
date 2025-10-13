-- Simple local/dev seed data
-- Organizations
INSERT INTO organizations (id, name)
VALUES ('org_demo', 'Demo Org')
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizations (id, name)
VALUES ('org_test', 'Test Org')
ON CONFLICT (id) DO NOTHING;

-- A demo content item and version for org_demo
DO $$
DECLARE
  v_ci_id text;
  v_cv_id text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE organization_id = 'org_demo') THEN
    v_ci_id := 'ci_seed_' || floor(extract(epoch from now()))::text;
    INSERT INTO content_items (id, organization_id, type, title, status, created_at, updated_at)
    VALUES (v_ci_id, 'org_demo', 'BLOG', 'Hello Bowery', 'DRAFT', now(), now());

    v_cv_id := 'cv_seed_' || floor(extract(epoch from now()))::text;
    INSERT INTO content_versions (id, content_item_id, version, title, body, summary, metadata_json, created_at)
    VALUES (v_cv_id, v_ci_id, 1, 'Hello Bowery', 'Seed body', 'Seed summary', '{}'::jsonb, now());

    UPDATE content_items SET current_version_id = v_cv_id, updated_at = now() WHERE id = v_ci_id;
  END IF;
END$$;


-- Seed baseline prompt templates if missing
DO $$
DECLARE
  v_exists int;
BEGIN
  SELECT COUNT(*) INTO v_exists FROM prompt_templates WHERE name = 'outline' AND channel = 'default';
  IF v_exists = 0 THEN
    INSERT INTO prompt_templates (id, name, version, channel, input_schema, template, output_schema)
    VALUES (
      'pt_outline_default_v1',
      'outline',
      'v1',
      'default',
      '{"type":"object","properties":{"brief":{"type":"string"},"angle":{"type":"string"},"sources":{"type":"array"}}}'::jsonb,
      'Create a concise outline for {{brief}}. Angle: {{angle}}. Use these sources: {{sources}}.',
      '{}'::jsonb
    );
  END IF;

  SELECT COUNT(*) INTO v_exists FROM prompt_templates WHERE name = 'draft' AND channel = 'default';
  IF v_exists = 0 THEN
    INSERT INTO prompt_templates (id, name, version, channel, input_schema, template, output_schema)
    VALUES (
      'pt_draft_default_v1',
      'draft',
      'v1',
      'default',
      '{"type":"object","properties":{"brief":{"type":"string"},"angle":{"type":"string"},"outline":{"type":"string"}}}'::jsonb,
      'Write a compelling draft for {{brief}}. Angle: {{angle}}. Follow this outline: {{outline}}.',
      '{}'::jsonb
    );
  END IF;

  SELECT COUNT(*) INTO v_exists FROM prompt_templates WHERE name = 'title' AND channel = 'default';
  IF v_exists = 0 THEN
    INSERT INTO prompt_templates (id, name, version, channel, input_schema, template, output_schema)
    VALUES (
      'pt_title_default_v1',
      'title',
      'v1',
      'default',
      '{"type":"object","properties":{"brief":{"type":"string"},"angle":{"type":"string"}}}'::jsonb,
      'Propose 5 engaging titles for {{brief}} (angle: {{angle}}).',
      '{}'::jsonb
    );
  END IF;

  SELECT COUNT(*) INTO v_exists FROM prompt_templates WHERE name = 'hashtags' AND channel = 'default';
  IF v_exists = 0 THEN
    INSERT INTO prompt_templates (id, name, version, channel, input_schema, template, output_schema)
    VALUES (
      'pt_hashtags_default_v1',
      'hashtags',
      'v1',
      'default',
      '{"type":"object","properties":{"brief":{"type":"string"},"angle":{"type":"string"}}}'::jsonb,
      'Recommend platform-agnostic hashtags for {{brief}} (angle: {{angle}}).',
      '{}'::jsonb
    );
  END IF;
END$$;

