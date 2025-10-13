# Observability Guide

## Kibana (logs)
- URL: http://localhost:55601
- Index pattern: `bowery-app-*`
- Quick search examples:
  - `container.name: bowery_api`
  - `level: error OR status:500`
  - `message: "queue" AND container.name: bowery_worker`
- Tips:
  - Use Discover to filter by `container.name`
  - Save search queries for API and worker separately

## Grafana (metrics)
- URL: http://localhost:53000 (admin/admin)
- Add Prometheus datasource: http://prometheus:9090
- Suggested panels:
  - Container CPU/memory (per service)
  - Queue depth (when metrics added)
  - API requests per minute (when metrics added)

## Log pipeline
- Filebeat tails Docker container logs
- Logstash parses JSON and forwards to Elasticsearch
- Index naming: `bowery-app-YYYY.MM.DD`
