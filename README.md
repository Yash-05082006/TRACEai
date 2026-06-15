# TRACEai — LLM Observability & AI Cost Optimization Platform

> Hackathon project · Aigenthix Hackathon · LLM Observability theme

Monitor every LLM request, trace token spend, and surface telemetry-grounded optimization recommendations — without changing your application SDK.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Features](#4-features)
5. [Architecture Diagram](#5-architecture-diagram)
6. [System Flow](#6-system-flow)
7. [Technology Stack](#7-technology-stack)
8. [Database Design](#8-database-design)
9. [API Documentation](#9-api-documentation)
10. [Authentication Flow](#10-authentication-flow)
11. [Analytics Engine](#11-analytics-engine)
12. [Optimization Agent](#12-optimization-agent)
13. [What-If Simulator](#13-what-if-simulator)
14. [Local Setup Instructions](#14-local-setup-instructions)
15. [Environment Variables](#15-environment-variables)
16. [Running Frontend](#16-running-frontend)
17. [Running Backend](#17-running-backend)
18. [Future Enhancements](#18-future-enhancements)
19. [Team Members](#19-team-members)
20. [Demo Instructions](#20-demo-instructions)
21. [Judging Criteria Alignment](#21-judging-criteria-alignment)

---

## 1. Project Overview

**TRACEai** is a proxy-based LLM observability platform that helps organizations:

- Connect AI-powered applications through a transparent HTTP proxy
- Capture prompt/completion token usage, latency, and error rates
- Calculate per-request and aggregate AI costs
- Visualize metrics in real-time dashboards
- Generate AI-driven, telemetry-grounded cost optimization recommendations

**Current repository state (as analyzed):**

| Layer | Status |
|-------|--------|
| Frontend UI (`techies-ai-insights/`) | **Partially complete** — 6 routes, rich mock data |
| Backend (FastAPI) | **Not started** |
| PostgreSQL schema | **Not started** |
| JWT authentication | **Not started** |
| LLM proxy & telemetry capture | **Not started** |
| Optimization agent | **Not started** (UI mock only) |

The frontend is production-quality UI scaffolding. All dashboard data is **hardcoded mock data** — no `fetch`, `axios`, or React Query data hooks exist yet.

---

## 2. Problem Statement

Organizations deploying LLM-powered features face:

- **Opaque spend** — Token bills grow faster than engineering can explain them
- **No per-feature attribution** — Finance sees a lump-sum OpenAI invoice; engineering cannot map cost to endpoints
- **Reactive optimization** — Teams switch models based on blog posts, not their own traffic patterns
- **Fragmented tooling** — Logs live in provider consoles; latency, errors, and cost are disconnected

Without proxy-level observability, teams cannot answer: *Which endpoint wastes money? Which model is over-provisioned? Where can we cache?*

---

## 3. Solution Overview

TRACEai sits between client applications and LLM providers (OpenAI, Anthropic, Google Gemini, etc.):

```
Client App  →  TRACEai Proxy  →  LLM Provider
                    ↓
              PostgreSQL (telemetry)
                    ↓
              Analytics APIs  →  React Dashboard
                    ↓
              Optimization Agent (telemetry → recommendations)
```

**Key design decisions:**

- **Proxy-based capture** — Zero SDK instrumentation; clients change only `base_url` and add `x-trace-key`
- **Provider-agnostic** — Forward `Authorization` headers; never store upstream API keys
- **Telemetry-first agent** — Recommendations cite measured distributions (token lengths, model mix, duplicate prompts), not generic advice

---

## 4. Features

### Implemented (Frontend UI)

| Feature | Route | Notes |
|---------|-------|-------|
| Marketing landing page | `/` | Hero, challenges, features, how-it-works, ROI calculator, integrations showcase |
| Overview dashboard | `/dashboard` | KPI cards, spend chart, cost-by-provider |
| Request Explorer | `/logs` | Searchable table, status filters, detail drawer with prompt/completion |
| Analytics | `/analytics` | Cost, Performance, Reliability, Usage tabs |
| Optimization Agent | `/cost-optimizer` | Recommendation cards with evidence, savings, confidence |
| Integrations wizard | `/integrations` | 5-step provider onboarding flow |

### Planned (Backend + Wiring)

| Feature | Priority |
|---------|----------|
| User registration & JWT login | P0 |
| Application & provider connection management | P0 |
| LLM proxy with telemetry capture | P0 |
| Analytics REST APIs | P0 |
| Optimization agent (telemetry-driven) | P0 — **primary judging criterion** |
| What-if cost simulator API | P1 |
| Real-time dashboard polling / SSE | P2 |

---

## 5. Architecture Diagram

```mermaid
flowchart TB
    subgraph clients [Client Applications]
        APP1[Doc Summarizer]
        APP2[Support Bot]
        APP3[Code Assistant]
    end

    subgraph traceai [TRACEai Platform]
        FE[TanStack Start Frontend<br/>port 8080]
        API[FastAPI Backend<br/>port 8004]
        PROXY[LLM Proxy Router<br/>/proxy/v1/*]
        AGENT[Optimization Agent]
        ANALYTICS[Analytics Engine]
    end

    subgraph providers [LLM Providers]
        OAI[OpenAI]
        ANT[Anthropic]
        GEM[Google Gemini]
    end

    subgraph data [Data Layer]
        PG[(PostgreSQL)]
    end

    APP1 & APP2 & APP3 -->|x-trace-key + Authorization| PROXY
    PROXY --> OAI & ANT & GEM
    PROXY -->|async write| PG
    FE -->|JWT| API
    API --> PG
    ANALYTICS --> PG
    AGENT --> PG
    AGENT -->|optional LLM| OAI
    API --> ANALYTICS
    API --> AGENT
    FE --> API
```

### Scalability Evolution (Documented for Hackathon Judges)

| Phase | Component | Role |
|-------|-----------|------|
| **Hackathon** | PostgreSQL | OLTP store for users, apps, requests, reports |
| **Growth** | Redis Streams | Buffer proxy telemetry writes; decouple capture from DB |
| **Scale** | Apache Kafka | Durable event bus for multi-region ingestion |
| **Analytics** | ClickHouse | Columnar OLAP for sub-second aggregates over billions of rows |
| **Standards** | OpenTelemetry GenAI | Export spans (`gen_ai.*` semantic conventions) to any observability backend |

**Migration path:** Proxy emits events → Redis Stream → Kafka consumer → dual-write PostgreSQL (OLTP) + ClickHouse (OLAP). Frontend analytics endpoints read from ClickHouse materialized views. OpenTelemetry exporter runs alongside the proxy for teams already on Datadog/Grafana/Jaeger.

---

## 6. System Flow

### End-to-End User Journey

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as FastAPI
    participant DB as PostgreSQL
    participant Proxy as LLM Proxy
    participant LLM as LLM Provider

    User->>FE: Register / Login
    FE->>API: POST /auth/register | /auth/login
    API->>DB: Store user / verify credentials
    API-->>FE: JWT access token

    User->>FE: Create Application
    FE->>API: POST /applications
    API->>DB: Insert application + generate trace_key
    API-->>FE: application_id, proxy_url

    User->>FE: Connect Provider (Integrations wizard)
    FE->>API: POST /applications/{id}/providers
    API-->>FE: proxy_url, x-trace-key

    Note over User,LLM: Runtime — client sends LLM traffic through proxy
  User->>Proxy: POST /proxy/v1/chat/completions
    Proxy->>LLM: Forward request
    LLM-->>Proxy: Response + usage
    Proxy->>DB: Insert llm_requests row
    Proxy-->>User: Response (unchanged)

    User->>FE: Open Dashboard
    FE->>API: GET /analytics/overview
    API->>DB: Aggregate queries
    API-->>FE: Metrics JSON

    User->>FE: Run Optimization Agent
    FE->>API: POST /optimization/analyze
    API->>DB: Query telemetry patterns
    API->>API: Run rule engine + optional LLM synthesis
    API->>DB: Store optimization_reports
    API-->>FE: Recommendations
```

---

## 7. Technology Stack

### Frontend (existing)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| TanStack Start | 1.167.x | Full-stack React framework (SSR + routing) |
| TanStack Router | 1.168.x | File-based routing |
| TanStack React Query | 5.83.x | Server state (configured, not yet used for API calls) |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui (Radix) | — | Component library (`src/components/ui/`) |
| Recharts | 2.15.x | Chart primitives (`chart.tsx` — dashboards use inline SVG instead) |
| Framer Motion | 12.x | Animations |
| Lucide React | — | Icons |
| Zod + React Hook Form | — | Form validation (available, unused in routes) |
| Vite | 8.x | Build tool |

### Backend (to implement)

| Technology | Purpose |
|------------|---------|
| FastAPI | REST API + proxy router |
| SQLAlchemy 2.x + Alembic | ORM & migrations |
| PostgreSQL 15+ | Primary datastore |
| python-jose / PyJWT | JWT tokens |
| passlib + bcrypt | Password hashing |
| httpx | Async upstream LLM forwarding |
| uvicorn | ASGI server |

---

## 8. Database Design

### Core Tables (Hackathon Schema)

#### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `gen_random_uuid()` |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT `now()` |

#### `applications`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → `users.id`, ON DELETE CASCADE |
| application_name | VARCHAR(255) | NOT NULL |
| provider | VARCHAR(64) | e.g. `openai`, `anthropic`, `google` |
| default_model | VARCHAR(128) | nullable |
| trace_key | VARCHAR(64) | UNIQUE, NOT NULL — maps to `x-trace-key` header |
| upstream_base_url | TEXT | nullable |
| created_at | TIMESTAMPTZ | DEFAULT `now()` |

#### `llm_requests`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| application_id | UUID | FK → `applications.id`, indexed |
| endpoint | VARCHAR(255) | e.g. `/v1/chat/completions` |
| model | VARCHAR(128) | |
| prompt_tokens | INTEGER | DEFAULT 0 |
| completion_tokens | INTEGER | DEFAULT 0 |
| total_tokens | INTEGER | GENERATED or computed |
| cost | NUMERIC(12,6) | USD |
| latency_ms | INTEGER | end-to-end ms |
| ttft_ms | INTEGER | nullable — time to first token |
| status | INTEGER | HTTP status code |
| provider | VARCHAR(64) | |
| feature | VARCHAR(128) | nullable — from `x-trace-feature` header |
| user_ref | VARCHAR(128) | nullable — from `x-trace-user` header |
| prompt_preview | TEXT | truncated for storage |
| completion_preview | TEXT | truncated |
| created_at | TIMESTAMPTZ | DEFAULT `now()`, indexed |

**Indexes:** `(application_id, created_at DESC)`, `(model, created_at)`, `(status, created_at)`

#### `optimization_reports`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| application_id | UUID | FK → `applications.id` |
| issue | TEXT | NOT NULL |
| recommendation | TEXT | NOT NULL |
| projected_savings | NUMERIC(12,2) | monthly USD |
| priority | VARCHAR(16) | `high` \| `medium` \| `low` |
| confidence_score | NUMERIC(4,3) | 0.000–1.000 |
| evidence | TEXT | nullable |
| reasoning | TEXT | nullable |
| lever | VARCHAR(64) | e.g. `model-right-sizing`, `prompt-caching` |
| status | VARCHAR(16) | `active` \| `dismissed` \| `applied` |
| created_at | TIMESTAMPTZ | DEFAULT `now()` |

### Supporting Tables (Required by Frontend)

#### `model_pricing`

Stores per-model input/output token prices for cost calculation.

| Column | Type |
|--------|------|
| id | SERIAL PK |
| provider | VARCHAR(64) |
| model | VARCHAR(128) |
| input_price_per_million | NUMERIC |
| output_price_per_million | NUMERIC |
| effective_from | DATE |

#### `refresh_tokens` (optional)

| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK |
| token_hash | VARCHAR |
| expires_at | TIMESTAMPTZ |

### ER Diagram

```mermaid
erDiagram
    users ||--o{ applications : owns
    applications ||--o{ llm_requests : generates
    applications ||--o{ optimization_reports : has

    users {
        uuid id PK
        string name
        string email
        string password_hash
        timestamp created_at
    }

    applications {
        uuid id PK
        uuid user_id FK
        string application_name
        string provider
        string default_model
        string trace_key
        timestamp created_at
    }

    llm_requests {
        uuid id PK
        uuid application_id FK
        string endpoint
        string model
        int prompt_tokens
        int completion_tokens
        numeric cost
        int latency_ms
        int status
        timestamp created_at
    }

    optimization_reports {
        uuid id PK
        uuid application_id FK
        text recommendation
        numeric projected_savings
        string priority
        numeric confidence_score
        timestamp created_at
    }
```

---

## 9. API Documentation

Base URL: `http://localhost:8004/api/v1`

All authenticated endpoints require: `Authorization: Bearer <jwt>`

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Returns JWT |
| GET | `/auth/me` | Current user profile |
| POST | `/auth/refresh` | Refresh token (optional) |

#### `POST /auth/register`

```json
// Request
{ "name": "Aria Chen", "email": "aria@acme.com", "password": "securepass123" }

// Response 201
{ "id": "uuid", "name": "Aria Chen", "email": "aria@acme.com", "access_token": "eyJ...", "token_type": "bearer" }
```

#### `POST /auth/login`

```json
// Request
{ "email": "aria@acme.com", "password": "securepass123" }

// Response 200
{ "access_token": "eyJ...", "token_type": "bearer", "expires_in": 3600 }
```

### Applications

| Method | Path | Description |
|--------|------|-------------|
| POST | `/applications` | Create application + trace key |
| GET | `/applications` | List user's applications |
| GET | `/applications/{id}` | Application detail + proxy URL |
| PATCH | `/applications/{id}` | Update name, default model |
| DELETE | `/applications/{id}` | Delete application |
| POST | `/applications/{id}/verify` | Poll for first proxied request |
| GET | `/applications/{id}/providers/status` | Connected provider health |

#### `POST /applications`

```json
// Request
{
  "application_name": "production",
  "provider": "openai",
  "default_model": "gpt-4o",
  "upstream_base_url": "https://api.openai.com/v1"
}

// Response 201
{
  "id": "uuid",
  "application_name": "production",
  "provider": "openai",
  "proxy_url": "http://localhost:8004/proxy/v1",
  "trace_key": "trace_sk_live_...",
  "created_at": "2026-06-15T00:00:00Z"
}
```

### LLM Proxy

| Method | Path | Description |
|--------|------|-------------|
| ALL | `/proxy/v1/{path:path}` | Forward to upstream provider |

**Required headers:**

| Header | Description |
|--------|-------------|
| `x-trace-key` | Application capture key |
| `Authorization` | Upstream provider API key (forwarded, not stored) |
| `x-trace-feature` | Optional feature/endpoint label |
| `x-trace-user` | Optional end-user identifier |

**Capture logic:**

1. Resolve `application` from `x-trace-key`
2. Record `started_at`, forward request via httpx
3. Parse provider response for `usage` block
4. Calculate cost from `model_pricing`
5. Insert `llm_requests` row (async-safe)
6. Return original response unchanged

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/overview` | KPI summary for dashboard |
| GET | `/analytics/cost-trend` | Spend time series |
| GET | `/analytics/token-trend` | Token volume time series |
| GET | `/analytics/models` | Model usage breakdown |
| GET | `/analytics/logs` | Paginated request logs |
| GET | `/analytics/application/{id}` | Per-application metrics |

**Common query params:** `range` (`1h`|`24h`|`7d`|`30d`|`90d`), `application_id`, `model`, `provider`

#### `GET /analytics/overview?range=24h`

```json
{
  "range": "24h",
  "metrics": [
    {
      "key": "req",
      "label": "Total Requests",
      "value": 284193,
      "delta": 2.8,
      "format": "neutral",
      "spark": [30, 40, 38, 44, 52, 50, 58, 62, 60, 66, 70, 74]
    },
    {
      "key": "tok",
      "label": "Total Tokens",
      "value": "182.4M",
      "raw_value": 182400000,
      "delta": 5.2,
      "format": "neutral",
      "spark": [28, 30, 36, 40, 44, 48, 52, 55, 60, 64, 70, 76]
    },
    {
      "key": "cost",
      "label": "Total Cost",
      "value": "$4,128",
      "raw_value": 4128.00,
      "delta": 7.6,
      "format": "neutral",
      "spark": [24, 28, 30, 34, 36, 40, 44, 48, 52, 56, 60, 66]
    },
    {
      "key": "lat",
      "label": "Avg Latency",
      "value": "918 ms",
      "raw_value": 918,
      "delta": 1.4,
      "format": "lowerBetter",
      "spark": [50, 52, 50, 54, 56, 52, 58, 60, 56, 58, 60, 62]
    },
    {
      "key": "err",
      "label": "Error Rate",
      "value": "0.61%",
      "raw_value": 0.0061,
      "delta": 0.2,
      "format": "lowerBetter",
      "spark": [10, 9, 11, 10, 12, 11, 10, 12, 13, 11, 12, 13]
    }
  ],
  "spend_over_time": [12, 18, 22, 28, 36, 44, 50, 58, 64, 72, 78, 84],
  "cost_by_provider": [
    { "name": "OpenAI", "amount": 2394.00, "pct": 58 },
    { "name": "Anthropic", "amount": 1156.00, "pct": 28 }
  ]
}
```

#### `GET /analytics/logs?page=1&limit=50&status=error&search=gpt-4o`

```json
{
  "total": 12,
  "page": 1,
  "items": [
    {
      "id": "req_8af21c",
      "ts": "2026-06-14T14:32:18.412Z",
      "endpoint": "/v1/chat/completions",
      "provider": "OpenAI",
      "model": "gpt-4o",
      "inTok": 1248,
      "outTok": 412,
      "cost": 0.0186,
      "latencyMs": 1840,
      "ttftMs": 320,
      "status": 200,
      "feature": "doc-summarizer",
      "user": "u_8421",
      "prompt": "Summarize the following...",
      "completion": "• Revenue grew 18%..."
    }
  ]
}
```

### Optimization

| Method | Path | Description |
|--------|------|-------------|
| POST | `/optimization/analyze` | Run agent on application telemetry |
| GET | `/optimization/reports` | List recommendations |
| GET | `/optimization/reports/{id}` | Single report |
| PATCH | `/optimization/reports/{id}` | Dismiss or mark applied |

#### `POST /optimization/analyze`

```json
// Request
{ "application_id": "uuid", "lookback_days": 30 }

// Response
{
  "current_monthly_spend": 12847.00,
  "total_identified_savings": 3362.00,
  "projected_spend": 9485.00,
  "recommendations": [
    {
      "id": "rec_01",
      "issue": "85% of requests contain less than 100 tokens.",
      "evidence": "Distribution query: 412,840 of 449,000 requests...",
      "recommendation": "Switch from GPT-4o to GPT-4o-mini for short requests.",
      "projected_savings": 1842.00,
      "priority": "high",
      "confidence_score": 0.92,
      "lever": "model-right-sizing"
    }
  ]
}
```

### What-If Simulator

| Method | Path | Description |
|--------|------|-------------|
| POST | `/simulator/what-if` | Compare current vs alternative model cost |
| GET | `/simulator/models` | Available models + pricing |

#### `POST /simulator/what-if`

```json
// Request
{
  "current_model": "gpt-4o",
  "alternative_model": "gpt-4o-mini",
  "monthly_requests": 1000000,
  "avg_input_tokens": 2000,
  "avg_output_tokens": 500
}

// Response
{
  "current_model": "gpt-4o",
  "alternative_model": "gpt-4o-mini",
  "current_monthly_cost": 17500.00,
  "projected_monthly_cost": 4875.00,
  "savings_amount": 12625.00,
  "savings_percentage": 72.1,
  "recommendation": "GPT-4o-mini handles routine requests at ~72% lower cost."
}
```

---

## 10. Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant API as FastAPI
    participant DB as PostgreSQL

    C->>API: POST /auth/register {email, password, name}
    API->>DB: INSERT users (bcrypt hash)
    API-->>C: {access_token, user}

    Note over C: Store token in memory / httpOnly cookie

    C->>API: GET /analytics/overview
    Note right of C: Authorization: Bearer <token>
    API->>API: Decode JWT, extract user_id
    API->>DB: Query scoped to user's applications
    API-->>C: Analytics JSON

    C->>API: POST /auth/login {email, password}
    API->>DB: SELECT user, verify bcrypt
    API-->>C: {access_token, expires_in: 3600}
```

**JWT payload:** `{ "sub": "<user_id>", "email": "...", "exp": <unix> }`

**Security notes:**

- Passwords hashed with bcrypt (cost factor 12)
- `trace_key` is separate from JWT — used only for proxy identification
- Upstream LLM API keys never persisted
- CORS: allow `http://localhost:8080` in development

---

## 11. Analytics Engine

### Aggregation Strategy (PostgreSQL — Hackathon)

| Metric | SQL approach |
|--------|--------------|
| Total requests | `COUNT(*)` filtered by `created_at` window |
| Total tokens | `SUM(total_tokens)` |
| Total cost | `SUM(cost)` |
| Avg latency | `AVG(latency_ms)` |
| Error rate | `COUNT(*) FILTER (WHERE status >= 400) / COUNT(*)` |
| Cost trend | `DATE_TRUNC('hour', created_at)` + `SUM(cost)` |
| Model mix | `GROUP BY model` |
| Delta % | Compare current window vs previous equal window |

### Frontend Mapping

| Frontend file | Backend endpoint(s) |
|---------------|---------------------|
| `dashboard.tsx` | `GET /analytics/overview`, `GET /analytics/cost-trend` |
| `analytics.tsx` (Cost tab) | `GET /analytics/cost-trend`, `GET /analytics/models` |
| `analytics.tsx` (Usage tab) | `GET /analytics/token-trend`, `GET /analytics/models` |
| `analytics.tsx` (Reliability) | Derived from `status` column aggregates |
| `analytics.tsx` (Performance) | `AVG/percentile(latency_ms)`, `ttft_ms` |
| `logs.tsx` | `GET /analytics/logs` |
| `AppShell.tsx` (sidebar status) | `GET /applications/{id}/providers/status` |

---

## 12. Optimization Agent

The optimization agent is the **primary judging criterion**. It must produce recommendations grounded in **actual telemetry**, not generic tips.

### Analysis Pipeline

```
1. INGEST   → Query llm_requests for application (30-day window)
2. PROFILE  → Compute distributions:
               - token length histogram (input, output)
               - model × endpoint matrix
               - prompt similarity clusters (SimHash / cosine on embeddings)
               - error rate by model
               - latency percentiles by model
3. DETECT   → Rule-based pattern matchers:
               - SHORT_PROMPT_EXPENSIVE_MODEL: >80% requests <300 tokens on gpt-4o
               - STATIC_PREFIX_BLOAT: repeated system prompt >40% of input tokens
               - DUPLICATE_PROMPTS: >20% near-duplicate embedding requests
               - OVERSIZED_CONTEXT: p90 input tokens > 8000
               - INTERNAL_ON_PREMIUM: non-customer endpoints on flagship models
4. SCORE    → projected_savings = eligible_volume × token_delta × price_delta
               confidence_score = f(sample_size, effect_size, quality_risk)
               priority = f(savings, confidence, implementation_effort)
5. SYNTHESIZE → Optional: pass structured findings to LLM for natural-language evidence/reasoning
6. PERSIST  → INSERT optimization_reports
```

### Example Rules (matching frontend mock)

| Pattern | Trigger | Recommendation | Savings calc |
|---------|---------|----------------|--------------|
| Model right-sizing | >85% requests <100 tokens on GPT-4o | Switch to GPT-4o-mini | `eligible_reqs × avg_tokens × price_delta` |
| Prompt caching | Static prefix >50% input tokens | Enable provider prompt cache | `prefix_tokens × hit_rate × cache_discount` |
| Semantic caching | >25% embedding cosine similarity >0.95 | Add semantic cache layer | `duplicate_completions × avg_completion_cost` |
| Context optimization | p90 input >4000 tokens on RAG endpoint | Retrieval-based context loading | `excess_tokens × input_price` |

### Output Schema (matches `cost-optimizer.tsx`)

```typescript
type Recommendation = {
  id: string;
  issue: string;
  evidence: string;        // MUST cite real query results
  recommendation: string;
  savings: number;       // monthly USD
  confidence: "High" | "Medium" | "Low";  // mapped from confidence_score
  reasoning: string;
  affects: string;         // "endpoint · model"
  lever: string;           // "Model right-sizing" | "Prompt caching" | etc.
};
```

---

## 13. What-If Simulator

### Current State

The landing page (`AICostCalculator.tsx`) implements a **client-side** simulator with hardcoded model pricing. It computes routing, caching, and context optimization percentages heuristically.

### Target State

Backend-powered simulator at `POST /simulator/what-if` using `model_pricing` table data.

**Integrate into app:** Add a "What-If" panel to `/cost-optimizer` or `/analytics` (Cost tab) — reuse existing `AICostCalculator` UI patterns with API-backed pricing.

---

## 14. Local Setup Instructions

### Prerequisites

- Node.js 20+ (or Bun)
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (recommended)

### Quick Start (once backend is implemented)

```bash
# 1. Clone and enter project
cd Aigenthix_Hackathon

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python scripts/seed_demo_data.py   # optional demo telemetry
uvicorn app.main:app --reload --port 8004

# 4. Frontend (separate terminal)
cd techies-ai-insights
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) — landing page  
Open [http://localhost:8080/dashboard](http://localhost:8080/dashboard) — platform UI

---

## 15. Environment Variables

### Frontend (`techies-ai-insights/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend URL, e.g. `http://localhost:8004/api/v1` |
| `VITE_PROXY_BASE_URL` | Yes | Proxy URL shown in integrations, e.g. `http://localhost:8004/proxy/v1` |
| `NODE_ENV` | No | `development` \| `production` |

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://traceai:traceai@localhost:5432/traceai` |
| `JWT_SECRET` | Yes | Random 256-bit secret for signing tokens |
| `JWT_ALGORITHM` | No | Default `HS256` |
| `JWT_EXPIRE_MINUTES` | No | Default `60` |
| `CORS_ORIGINS` | No | `http://localhost:8080` |
| `OPENAI_API_KEY` | No | Only for agent synthesis LLM calls |
| `LOG_LEVEL` | No | `info` |

### Docker Compose

| Variable | Default |
|----------|---------|
| `POSTGRES_USER` | `traceai` |
| `POSTGRES_PASSWORD` | `traceai` |
| `POSTGRES_DB` | `traceai` |

---

## 16. Running Frontend

```bash
cd techies-ai-insights
npm install        # or: bun install
npm run dev        # http://localhost:8080
npm run build      # production build
npm run preview    # preview production build
```

**Routes:**

| URL | Page |
|-----|------|
| `/` | Landing |
| `/dashboard` | Overview |
| `/logs` | Request Explorer |
| `/analytics` | Analytics |
| `/cost-optimizer` | Optimization Agent |
| `/integrations` | Provider onboarding |

---

## 17. Running Backend

> **Status:** Backend not yet in repository. Follow structure in [Backend Folder Structure](#backend-folder-structure) below.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8004
```

API docs (auto-generated): [http://localhost:8004/docs](http://localhost:8004/docs)

---

## Backend Folder Structure

```
backend/
├── alembic/
│   ├── versions/
│   └── env.py
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app, CORS, router mount
│   ├── config.py               # pydantic-settings
│   ├── database.py             # async SQLAlchemy engine + session
│   ├── dependencies.py         # get_db, get_current_user
│   ├── models/
│   │   ├── user.py
│   │   ├── application.py
│   │   ├── llm_request.py
│   │   ├── optimization_report.py
│   │   └── model_pricing.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── application.py
│   │   ├── analytics.py
│   │   ├── optimization.py
│   │   └── simulator.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── applications.py
│   │   ├── analytics.py
│   │   ├── optimization.py
│   │   └── simulator.py
│   ├── proxy/
│   │   ├── router.py           # /proxy/v1/{path:path}
│   │   ├── forwarder.py        # httpx upstream calls
│   │   ├── capture.py          # parse usage, compute cost
│   │   └── pricing.py          # model price lookup
│   ├── services/
│   │   ├── analytics_service.py
│   │   ├── optimization_agent.py
│   │   └── simulator_service.py
│   └── utils/
│       ├── security.py         # JWT + bcrypt
│       └── tokens.py           # trace_key generation
├── scripts/
│   ├── seed_demo_data.py       # populate mock-equivalent telemetry
│   └── seed_model_pricing.py
├── tests/
│   ├── test_auth.py
│   ├── test_proxy.py
│   ├── test_analytics.py
│   └── test_optimization_agent.py
├── alembic.ini
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

## 18. Future Enhancements

- **Real-time updates** — SSE or WebSocket push for overview metrics
- **Multi-tenant organizations** — teams, RBAC, shared applications
- **Budget alerts** — Slack/email when spend exceeds threshold
- **Quality eval integration** — tie model-downgrade recommendations to eval scores
- **Prompt versioning** — diff prompt templates over time
- **Export** — CSV/Parquet log export for data teams
- **Infrastructure scaling** — Redis Streams → Kafka → ClickHouse (see Architecture)
- **OpenTelemetry GenAI** — standardized span export
- **Auth pages in frontend** — `/login`, `/register` routes (not yet built)

---

## 19. Team Members

| Name | Role | Responsibilities |
|------|------|------------------|
| _TBD_ | Frontend | TanStack Start UI, API integration |
| _TBD_ | Backend | FastAPI, proxy, PostgreSQL |
| _TBD_ | ML/Agent | Optimization agent, telemetry analysis |
| _TBD_ | DevOps | Docker, deployment, demo environment |

_Update this table with actual team member names before submission._

---

## 20. Demo Instructions

### Pre-Demo Setup (15 min before)

1. Start PostgreSQL + backend with seeded demo data (`scripts/seed_demo_data.py`)
2. Start frontend (`npm run dev`)
3. Verify proxy captures a test request:

```bash
curl -X POST http://localhost:8004/proxy/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-trace-key: trace_sk_demo_..." \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
```

### Demo Script (5–7 minutes)

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Open `/` | Problem statement, ROI calculator |
| 2 | Click "Open Platform" → `/dashboard` | Live KPIs update after proxy traffic |
| 3 | `/integrations` | 5-step wizard, proxy URL + trace key |
| 4 | Send live curl through proxy | Sidebar "Receiving traffic" indicator |
| 5 | `/logs` | New request appears in table; open detail drawer |
| 6 | `/analytics` | Cost + usage tabs reflect captured data |
| 7 | `/cost-optimizer` | Click "Re-run analysis" → telemetry-grounded recommendations |
| 8 | What-if simulator | Compare GPT-4o vs GPT-4o-mini with real pricing |

### Fallback

If live proxy fails, seeded data matches frontend mock shapes — dashboard remains demoable offline.

---

## 21. Judging Criteria Alignment

| Criterion | How TRACEai Addresses It |
|-----------|--------------------------|
| **LLM Observability** | Proxy captures every request: tokens, latency, status, cost, prompt/completion previews |
| **AI Cost Optimization** | Real-time cost attribution by model, provider, feature, endpoint |
| **Technical Depth** | Proxy forwarding, async telemetry persistence, SQL aggregations, rule-based + LLM agent |
| **Innovation** | Telemetry-grounded agent cites evidence from actual traffic distributions |
| **UX / Product** | Polished 6-route frontend already built; onboarding wizard under 5 minutes |
| **Scalability Story** | Documented path: PostgreSQL → Redis → Kafka → ClickHouse + OpenTelemetry |
| **Feasibility** | Minimal client integration (base URL swap + one header) |

---

## Repository Analysis Summary

### Frontend Architecture

- **Framework:** TanStack Start (React 19 + Vite SSR), not a standalone CRA/Vite SPA
- **Routing:** File-based TanStack Router in `src/routes/`
- **Layout:** `AppShell` wraps all authenticated-style pages with sidebar navigation
- **Data layer:** 100% inline mock constants — React Query is wired in `__root.tsx` but unused
- **Charts:** Custom inline SVG (`Sparkline`, `AreaChart`, `Bars`) in route files; shadcn `chart.tsx` + Recharts available but unused in dashboards
- **Auth:** Not implemented — navbar shows mock user "Aria"

### Reusable Components

| Component | Location | Used by |
|-----------|----------|---------|
| `AppShell`, `Card` | `components/app/AppShell.tsx` | All platform routes |
| `SectionHeader` | `components/landing/Features.tsx` | Landing sections |
| shadcn/ui (40+ components) | `components/ui/` | Tooltip in dashboard; rest available |
| Landing sections | `components/landing/*` | `/` only |

### Missing Components (Gap List)

**Backend (entire layer):**
- FastAPI application
- PostgreSQL models & migrations
- JWT auth endpoints
- LLM proxy router
- Analytics aggregation service
- Optimization agent service
- What-if simulator API
- Seed scripts for demo data

**Frontend integration:**
- API client module (`src/lib/api.ts`)
- Auth context + `/login`, `/register` routes
- Replace mock data in 5 route files with React Query hooks
- Wire integrations wizard to `POST /applications`
- Wire "Re-run analysis" button to `POST /optimization/analyze`
- Environment variable `VITE_API_BASE_URL`
- Optional: mobile sidebar (currently `hidden lg:flex`)

**Infrastructure:**
- `docker-compose.yml`
- Root monorepo orchestration
- CI pipeline

---

## 48-Hour Implementation Plan

### Hour 0–4: Foundation
- [ ] Create `backend/` folder structure
- [ ] Docker Compose for PostgreSQL
- [ ] SQLAlchemy models + Alembic migrations (all tables)
- [ ] Seed `model_pricing` with current OpenAI/Anthropic/Google rates
- [ ] FastAPI skeleton with health check + CORS

### Hour 4–10: Auth + Applications
- [ ] `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- [ ] `POST /applications` with `trace_key` generation
- [ ] Frontend: `src/lib/api.ts`, auth context, login/register pages
- [ ] Wire integrations wizard steps 1–3 to API

### Hour 10–20: Proxy (Critical Path)
- [ ] `/proxy/v1/{path:path}` forwarder (OpenAI first)
- [ ] Usage parsing from OpenAI response JSON
- [ ] Cost calculation from `model_pricing`
- [ ] Async DB insert for `llm_requests`
- [ ] Add Anthropic + Gemini response parsers
- [ ] `POST /applications/{id}/verify` endpoint
- [ ] Wire integrations step 4 (verify traffic)

### Hour 20–28: Analytics APIs
- [ ] `GET /analytics/overview` with range param + delta calculation
- [ ] `GET /analytics/cost-trend`, `/token-trend`, `/models`
- [ ] `GET /analytics/logs` with search, status, provider filters + pagination
- [ ] `GET /analytics/application/{id}`
- [ ] Frontend: React Query hooks; replace mocks in `dashboard.tsx` first

### Hour 28–36: Optimization Agent (Judging Priority)
- [ ] Telemetry profiling queries (token distributions, model mix, duplicates)
- [ ] Rule engine with 5+ detectors
- [ ] Savings calculator per rule
- [ ] `POST /optimization/analyze` + `GET /optimization/reports`
- [ ] Wire `cost-optimizer.tsx` to live API
- [ ] `scripts/seed_demo_data.py` — enough data to trigger all rules

### Hour 36–42: Simulator + Remaining Frontend
- [ ] `POST /simulator/what-if`
- [ ] Wire `analytics.tsx` tabs to respective endpoints
- [ ] Wire `logs.tsx` to `/analytics/logs`
- [ ] AppShell provider status from API

### Hour 42–48: Polish + Demo
- [ ] End-to-end test: register → create app → proxy request → dashboard updates
- [ ] Error handling + loading skeletons in frontend
- [ ] README team names + demo script rehearsal
- [ ] Deploy (Railway/Fly.io or local Docker demo)

---

## License

Hackathon submission — license TBD.
