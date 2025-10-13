# Agent Bowery - Operations Runbook

## Quick Start

### Local Development
```bash
# Start all services
docker compose -f infra/docker/docker-compose.yml up -d

# Check service health
curl http://localhost:44000/health

# View logs
docker logs -f bowery_api
docker logs -f bowery_worker
```

### Service URLs
- **API**: http://localhost:44000
- **Web Dashboard**: http://localhost:43000
- **Kibana (Logs)**: http://localhost:55601
- **Grafana (Metrics)**: http://localhost:53000 (admin/admin)
- **Prometheus**: http://localhost:19090

## Authentication

### API Keys (Service-to-Service)
```bash
curl -H "X-API-KEY: test-api-key" http://localhost:44000/health
```

### JWT Tokens (User Authentication)
```bash
# Get admin token
curl "http://localhost:44000/auth/dev-token?roles=admin"

# Get editor token  
curl "http://localhost:44000/auth/dev-token?roles=editor"

# Use token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:44000/content
```

## Rate Limiting

### Default Limits
- **Global**: 60 requests/minute per API key or IP
- **Burst**: 20 extra tokens per window
- **Window**: 60 seconds

### Per-Route Overrides
Configure via `RL_ROUTE_OVERRIDES` environment variable:
```json
[
  {"route": "/content/schedule", "windowSec": 60, "maxReq": 20},
  {"route": "/posts/*", "windowSec": 60, "maxReq": 30}
]
```

### Rate Limit Headers
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time until reset (seconds)
- `Retry-After`: Seconds to wait when rate limited (429)

## Idempotency

### Usage
Include `Idempotency-Key` header on POST requests:
```bash
curl -X POST \
  -H "Idempotency-Key: unique-request-id-123" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Post"}' \
  http://localhost:44000/content
```

### Behavior
- **First Request**: Processed normally, response cached
- **Duplicate Request**: Returns cached response with `X-Idempotent-Replay: true`
- **TTL**: 10 minutes
- **Conflict**: 409 if same key is already processing

## Content Workflow

### 1. Create Content
```bash
curl -X POST http://localhost:44000/content \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Blog Post",
    "type": "BLOG",
    "status": "DRAFT"
  }'
```

### 2. Add Content Version
```bash
curl -X POST http://localhost:44000/content/{id}/version \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Full blog post content...",
    "title": "Updated Title",
    "summary": "Brief summary"
  }'
```

### 3. Approve Content (Generates Platform Previews)
```bash
curl -X POST http://localhost:44000/content/{id}/approve \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "approvedBy": "admin-user",
    "notes": "Ready for publishing",
    "generatePreviews": true,
    "platforms": ["FACEBOOK", "LINKEDIN"]
  }'
```

### 4. Schedule Content
```bash
curl -X POST http://localhost:44000/content/{id}/schedule \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "FACEBOOK",
    "scheduledAt": "2024-01-15T10:00:00Z"
  }'
```

## Token Management

### OAuth Setup
1. **Meta**: Visit `/oauth/meta/start` to get authorization URL
2. **LinkedIn**: Visit `/oauth/linkedin/start` 
3. **Google/YouTube**: Visit `/oauth/google/start`

### Token Refresh
- **Proactive**: Refreshes tokens <15 minutes before expiry
- **Reactive**: Refreshes on 401 responses
- **Manual**: `POST /tokens/{provider}/refresh`

### Token Status
```bash
curl http://localhost:44000/tokens/meta/status
```

## Webhook Configuration

### Meta Webhooks
1. **Verification**: `GET /webhooks/meta?hub.mode=subscribe&hub.verify_token=dev-token&hub.challenge=CHALLENGE`
2. **Events**: `POST /webhooks/meta` with `X-Hub-Signature-256` header

### Webhook Verification
- **Meta**: HMAC-SHA256 with `META_APP_SECRET`
- **LinkedIn**: HMAC-SHA256 with `LINKEDIN_WEBHOOK_SECRET`
- **Google**: HMAC with `GOOGLE_WEBHOOK_SECRET`

## Monitoring & Troubleshooting

### Logs (Kibana)
1. Open http://localhost:55601
2. Create index pattern: `bowery-app-*`
3. Search examples:
   - `container.name: bowery_api AND level: error`
   - `message: "rate_limited"`
   - `message: "webhook" AND container.name: bowery_worker`

### Metrics (Grafana)
1. Open http://localhost:53000 (admin/admin)
2. Add Prometheus datasource: http://prometheus:9090
3. Key metrics:
   - Container CPU/Memory usage
   - Queue depth and processing rates
   - API request rates and error rates

### Common Issues

#### API Not Starting
```bash
# Check logs
docker logs bowery_api

# Common fixes
docker compose -f infra/docker/docker-compose.yml restart api
```

#### Database Connection Issues
```bash
# Check PostgreSQL
docker exec -it bowery_postgres psql -U bowery -d bowery -c "SELECT 1;"

# Run migrations
docker exec -i bowery_postgres psql -U bowery -d bowery < migrations/001_init.sql
```

#### Redis Connection Issues
```bash
# Check Redis
docker exec -it bowery_redis redis-cli ping

# Check queue status
docker exec -it bowery_redis redis-cli LLEN bull:test-jobs:waiting
```

#### Rate Limiting Issues
```bash
# Check rate limit keys
docker exec -it bowery_redis redis-cli KEYS "ratelimit:*"

# Clear rate limits (dev only)
docker exec -it bowery_redis redis-cli FLUSHDB
```

### Performance Tuning

#### Database
- **Connection Pool**: 10-20 connections per service
- **Query Timeout**: 5-15 seconds
- **Indexes**: Monitor slow queries >500ms

#### Redis
- **Memory**: Monitor usage, set maxmemory policy
- **TTL**: Review cache expiration times
- **Persistence**: Configure RDB/AOF as needed

#### Queue Processing
- **Concurrency**: Adjust worker concurrency based on load
- **Retry Logic**: Exponential backoff with max attempts
- **Dead Letter Queue**: Monitor failed jobs

## Security

### Environment Variables
- `JWT_SECRET`: Strong secret for JWT signing
- `TOKEN_ENC_KEY`: 32-byte key for token encryption
- `API_KEYS`: Comma-separated list of valid API keys
- Platform secrets: `META_APP_SECRET`, `LINKEDIN_WEBHOOK_SECRET`, etc.

### Best Practices
- Rotate API keys regularly
- Use HTTPS in production
- Monitor for suspicious activity
- Keep dependencies updated
- Regular security audits

## Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Load balancer configured
- [ ] CDN setup (if needed)

### Scaling
- **Horizontal**: Add more API/worker instances
- **Database**: Read replicas, connection pooling
- **Cache**: Redis cluster for high availability
- **Queue**: Multiple workers, priority queues

## Support

### Debug Mode
Set `NODE_ENV=development` for detailed logging and error messages.

### Health Checks
- **API**: `GET /health`
- **Database**: Connection test in health endpoint
- **Redis**: Connection test in health endpoint
- **External APIs**: Token validation tests

### Emergency Procedures
1. **Service Down**: Check logs, restart containers
2. **Database Issues**: Check connections, run migrations
3. **Queue Backlog**: Scale workers, check for stuck jobs
4. **Rate Limiting**: Adjust limits, clear Redis if needed
