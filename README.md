# Agent Bowery Monorepo

A monorepo for Agent Bowery: social, web, blog, and newsletter management.

## Structure

- apps/
  - api: Backend API gateway and webhooks
  - worker: Background jobs (scheduling, publishing, retries)
  - web: Next.js dashboard
- packages/
  - config: Shared configuration and env schema
  - db: Database schema and migrations
  - connectors: Platform connectors (Meta, GBP, LinkedIn, YouTube, WordPress, Mail)
  - logging: Logging and observability helpers
  - queue: Shared queue/job definitions
- infra/
  - docker: Docker Compose and service configs
  - observability: Prometheus/Grafana/ELK configs
  - ci: CI/CD workflows
- docs/: Runbooks and onboarding
- migrations/: Database migration scripts
- test/: Automated tests
- doc/: Project documentation (additional)

## Custom Local Ports (to avoid conflicts)

- Postgres: host 55432 → container 5432
- Redis: host 56379 → container 6379
- Elasticsearch: host 19200 → container 9200
- Kibana: host 55601 → container 5601
- Prometheus: host 19090 → container 9090
- Grafana: host 53000 → container 3000
- API (dev): host 44000 → container 4000
- Web (dev): host 43000 → container 3000

## Getting Started (local)

1. Copy `.env.example` to `.env` and adjust values as needed.
2. Start infrastructure services:
   - `docker compose -f infra/docker/docker-compose.yml up -d`
3. Access services:
   - API: http://localhost:44000
   - Web: http://localhost:43000
   - Kibana: http://localhost:55601
   - Prometheus: http://localhost:19090
   - Grafana: http://localhost:53000
4. Stop all:
   - `docker compose -f infra/docker/docker-compose.yml down`

## Architecture & Flow Diagrams

- See `doc/diagrams.md` for the system architecture and sequence diagrams (OAuth, publish, webhooks).

## Notes
- Follow directory conventions: `/test`, `/migrations`, `/doc`.
- No secrets should be committed. Use `.env` locally and a cloud secrets manager in prod.
