# Security and Gateway Policies

## Authentication
- Dashboard: Bearer JWT (HS256). Claim `roles`: `admin|editor|viewer`.
- Service-to-service: `X-API-KEY` header. Configure `API_KEYS` as comma-separated list.

## Rate limiting
- Defaults: `RL_WINDOW_SEC=60`, `RL_MAX_RPM=60`, `RL_BURST=20`.
- Overrides: `RL_ROUTE_OVERRIDES` JSON, e.g. `[{"route":"/content/schedule","windowSec":60,"maxReq":20}]`.
- Returns `429` and `Retry-After`.

## Idempotency
- Header: `Idempotency-Key` on POST.
- Replay: server caches successful response body for TTL and returns `X-Idempotent-Replay: true` on replays.

## Correlation ID and Errors
- Incoming header `X-Correlation-Id` honored or generated.
- Response includes `X-Correlation-Id`.
- Errors follow envelope: `{ error, code, message, correlationId, path, method }`.


