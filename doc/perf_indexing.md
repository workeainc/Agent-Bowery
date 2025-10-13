# Performance & Indexing Strategy

## Postgres
- Indexes
  - content_items (organization_id)
  - schedules (scheduled_at, platform)
  - leads (status, created_at)
  - tokens (social_account_id, created_at)
- Partitioning
  - analytics_daily: monthly partitions if > 5M rows/year
  - messages: monthly partitions if volume > 5M/year
- Pooling
  - pg Pool: 10–20 connections per app
  - statement_timeout: 5–15s
  - log_min_duration_statement: 500–1000ms (dev)

## Elasticsearch
- Indexes
  - content: text fields (title/body) with standard analyzer; ids as keyword
- ILM
  - analytics-* hot-warm-delete: 30d hot, 60d warm, delete at 180d
- Tuning
  - refresh_interval: 5s
  - bulk requests for backfills

## Caching (Redis)
- content detail: 5–15m TTL
- social account lookups: 5–15m TTL

## Observability
- Log every DB query > 500ms
- Custom app metrics: queue sizes, publish success/fail counts
