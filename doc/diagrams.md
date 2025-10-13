## Agent Bowery Architecture and Flow Diagrams

This document provides a high-level system architecture diagram and sequence diagrams for the OAuth connect flow, the publish flow, and webhook processing.

### System Architecture

```mermaid
graph TD
  subgraph Client
    W[Web (Next.js Dashboard)]
  end

  subgraph API[NestJS API]
    Ctrls[Controllers: content, oauth, webhooks, posts, jobs, health, token]
    Mid[Middlewares: correlation, rate-limit, idempotency]
    Filt[GlobalHttpExceptionFilter]
    SvcToken[TokenService]
    SvcContentAd[ContentAdaptationService]
    SvcContentAp[ContentApprovalService]
    SvcPublish[PlatformPublishService]
    SvcPlatform[PlatformService]
    CliMeta[MetaClientService]
    CliLinkedIn[LinkedInClientService]
    SvcQueue[QueueService (BullMQ producers)]
  end

  subgraph Worker[Worker (BullMQ)]
    WkrPublish[publish-jobs]
    WkrWebhook[webhook-jobs]
    Cron[cron sweeper]
  end

  subgraph Data
    DB[(PostgreSQL)]
    Redis[(Redis)]
  end

  subgraph Providers
    Meta[Meta (FB/IG)]
    LinkedIn[LinkedIn]
    Google[Google/GBP]
    YouTube[YouTube]
  end

  W -->|REST| Ctrls
  Ctrls --> Mid
  Ctrls --> Filt
  Ctrls --> SvcToken
  Ctrls --> SvcContentAd
  Ctrls --> SvcContentAp
  Ctrls --> SvcPublish
  Ctrls --> SvcPlatform
  Ctrls --> SvcQueue

  SvcToken <-->|cache| Redis
  SvcToken -->|read/write| DB
  SvcContentAp -->|store previews/approvals| DB
  SvcPublish -->|content/schedules| DB
  SvcPublish --> CliMeta
  SvcPublish --> CliLinkedIn

  SvcPlatform --> Meta
  SvcPlatform --> LinkedIn
  SvcPlatform --> Google
  SvcPlatform --> YouTube

  Ctrls -. webhooks .->|/webhooks/*| Providers
  Providers -->|Webhook POST| Ctrls

  SvcQueue -->|enqueue publish/webhook| WkrPublish
  SvcQueue -->|enqueue webhook| WkrWebhook

  Cron -->|poll /content/schedules/due| Ctrls
  Cron -->|enqueue publish| WkrPublish

  WkrPublish -->|get token| Redis
  WkrPublish -->|fallback| DB
  WkrPublish -->|post media/content| Providers
  WkrPublish -->|record outcome| DB

  WkrWebhook -->|process events| DB
```

### OAuth Connect Flow

```mermaid
sequenceDiagram
  participant User
  participant Web as Web (Next.js)
  participant API as API (NestJS)
  participant Provider as OAuth Provider (Meta/LinkedIn/Google)
  participant DB as Postgres

  User->>Web: Click "Connect {provider}"
  Web->>API: GET /oauth/:provider/start
  API-->>Web: { redirectUrl, state }
  Web->>Provider: Redirect user to consent screen
  Provider-->>Web: Redirect back with code+state
  Web->>API: GET /oauth/:provider/callback?code=...&state=...
  API->>Provider: Exchange code for tokens
  Provider-->>API: access_token (+refresh_token, expires_in)
  API->>DB: upsert SocialAccount (org, platform, extId)
  API->>DB: insert Token (encrypted access/refresh, expiry, scopes)
  API-->>Web: { saved: true, has_access, has_refresh }
```

### Publish Flow (Schedule → Queue → Worker → Provider)

```mermaid
sequenceDiagram
  participant Web as Web (Next.js)
  participant API as API (NestJS)
  participant Queue as BullMQ (publish-jobs)
  participant Worker as Worker (publish)
  participant Redis as Redis
  participant DB as Postgres
  participant Provider as Platform API

  Web->>API: POST /content/:id/schedule { platform, scheduledAt }
  API->>DB: create Schedule (pending)
  API->>Queue: enqueue publish job
  API-->>Web: 200 { scheduleId }

  Note over Worker,API: Additionally, Cron polls /content/schedules/due and enqueues jobs

  Queue-->>Worker: deliver publish job
  Worker->>Redis: get cached access token
  alt token missing/near expiry
    Worker->>DB: load latest token
    Worker->>Provider: refresh if needed
    Provider-->>Worker: new access_token
    Worker->>Redis: cache access token
  end
  Worker->>DB: load content + current version
  Worker->>Provider: publish (text/media)
  Provider-->>Worker: providerId or error (429/401/...)
  Worker->>DB: update Schedule status (published/failed, metadata)
  Worker-->>Queue: complete job
```

### Webhook Processing Flow

```mermaid
sequenceDiagram
  participant Provider as Provider (Meta/LinkedIn/Google)
  participant API as API (NestJS)
  participant Queue as BullMQ (webhook-jobs)
  participant Worker as Worker (webhook)
  participant DB as Postgres

  Provider->>API: POST /webhooks/:provider (raw body)
  API->>API: Verify HMAC signature
  API->>API: Compute idempotency key (hash raw body + signature)
  API->>DB: store webhook event {id, provider, idemKey, headers, raw}
  API->>DB: mark idemKey processed
  API->>Queue: enqueue webhook job {idemKey, provider}
  API-->>Provider: 200 { ok: true }

  Queue-->>Worker: deliver webhook job
  Worker->>DB: fetch/process event(s) by idemKey
  Worker-->>Queue: complete job
```

### Notes
- Role-based access guards protect content routes (`GatewayAuthGuard`, `RolesGuard`).
- Images/videos are processed per-platform (dimensions/format) before upload.
- Retries/backoff are handled by BullMQ; 401s imply token refresh, 429s imply backoff.


