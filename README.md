# MockLab

> **Design the API. Mock it in seconds. Prove it in CI.**

MockLab is a high-performance, developer-first API mocking and contract-testing platform. It enables frontend and backend teams to decouple development, simulate real-world network edge cases, manage stateful scenarios, and verify API contract compatibility automatically in continuous integration.

[![CI](https://github.com/razikuljoni/MockLab/actions/workflows/ci.yml/badge.svg)](https://github.com/razikuljoni/MockLab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript: 5.8](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js: 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![NestJS: 11](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com/)

---

## Key Highlights

- **OpenAPI 3.0 / 3.1 & GraphQL Spec Import**: Instant mock generation with recursive `$ref` resolution, circular reference protection, and JSONPath error highlighting.
- **Dynamic Catch-All Mock Router (`/m/:slug/*`)**: Priority-ordered matching clauses (headers, params, JSONPath body) with Handlebars templating (`{{uuid}}`, `{{body.name}}`, `{{now}}`).
- **WireMock-Style Near-Miss Diagnostics**: Unmatched requests return an actionable `404 Not Found` report naming the closest candidate rule and the exact missed clause.
- **Stateful Scenarios & Buckets**: In-memory and Redis-backed state machine engines supporting CRUD operations on collection buckets with isolated scenario keys.
- **Interactive Request Playground**: Real-time cURL generator, live rule prediction, split latency breakdown (DNS, TCP, TTFB), and validation warnings.
- **Traffic Inspector**: Non-blocking asynchronous batch queue with sensitive auth header redaction, 100 KB payload safety cap, and 1-click "Create rule from request".
- **Contract Drift Verification**: Deep structural JSON diffing with strict `PASS`, `BREAKING`, `NON_BREAKING`, and `ERROR` classification and live provider verification.
- **Automated CI Integration**: Copyable GitHub Actions YAML, exit-code pipeline gates, scheduled automated sweeps, and dynamic SVG badges.
- **Multi-Tenant RBAC & Security**: Stripe-style API tokens (`mk_live_`, `mk_test_`), 60-second sliding-window rate limiting, and Owner/Admin/Editor/Viewer role matrix.

---

## 24-Screen Application Map

Every screen in MockLab is built to the Stitch visual reference using the dark-mode token system (`#101208` Canvas, `#16190B` Surface, `#282F14` Border, `#BFFF3C` Electric Lime):

| # | Screen Name | Route | Purpose |
|---|---|---|---|
| 1 | **Landing Page** | `/` | Hero section, interactive terminal demo, feature breakdown, CTA |
| 2 | **Pricing** | `/pricing` | Free (\$0), Pro (\$19), and Team (\$79) tiers with feature matrices |
| 3 | **Documentation** | `/docs` | 5-minute quickstart, OpenAPI import guide, templating reference |
| 4 | **Authentication** | `/login`, `/signup`, `/forgot` | Email/password login, JWT tokens, automatic workspace provisioning |
| 5 | **Dashboard** | `/dashboard` | Workspace metrics, quick actions, active project cards |
| 6 | **Projects List** | `/projects` | Project overview, search filtering, contract status indicators |
| 7 | **Project Overview** | `/projects/[id]` | Live/Paused toggle, Reset State trigger, hit rate charts, tags |
| 8 | **Import Spec** | `/projects/[id]/import` | URL, upload, or paste OpenAPI 3.0/3.1 specs with re-import diffs |
| 9 | **Endpoints List** | `/projects/[id]/endpoints` | Grouped by tag, HTTP method chips, rule counters, hit telemetry |
| 10 | **Request Playground** | `/projects/[id]/playground` | Mock/Real proxy, headers editor, cURL export, TTFB breakdown |
| 11 | **Rules Editor** | `/projects/[id]/endpoints/[op]/rules` | Priority dragging, matchers, Handlebars templates, faults |
| 12 | **Stateful Scenarios** | `/projects/[id]/scenarios` | Stepper transitions, active bucket data table, state reset dialog |
| 13 | **Traffic Inspector** | `/projects/[id]/logs` | Dense 32px log table, Near-Miss diagnosis, 1-click rule generator |
| 14 | **Contract Tests List** | `/projects/[id]/contracts` | Expectations table, "Run All" trigger, verdict summaries |
| 15 | **Contract Run Detail** | `/projects/[id]/contracts/runs/[runId]` | Side-by-side synchronized diff, character-level highlights |
| 16 | **Contract Schedules** | `/projects/[id]/contracts/schedules` | `@hourly`, `@daily`, `@weekly` automated sweeps |
| 17 | **CI Integration** | `/projects/[id]/ci` | 1-click GitHub Actions YAML, GitLab CI template, SVG badges |
| 18 | **Team & Roles** | `/workspace/team` | Team table, role switcher (Owner/Admin/Editor/Viewer), invites |
| 19 | **API Keys** | `/workspace/keys` | Stripe-style key generation, SHA-256 storage, show-once modal |
| 20 | **Workspace Settings** | `/workspace/settings` | Default environment, mock auth default, retention, danger zone |
| 21 | **Billing & Plans** | `/workspace/billing` | Quota consumption meters, plan upgrade cards, invoice history |
| 22 | **Account Settings** | `/account` | User profile, password management, notification toggles |
| 23 | **Status & Error States** | `/_not-found`, `/status` | 404 Near-Miss search, 503 paused, 429 rate limit, spec errors |
| 24 | **Design System Board** | `/design-system` | Color swatches, typography scales, primitives, WCAG AA matrix |

---

## Local Quickstart

### Prerequisites
- Node.js 22+
- pnpm 10+
- Docker & Docker Compose (optional for PostgreSQL + Redis)

```bash
# 1. Start local PostgreSQL and Redis services
docker compose up -d

# 2. Install dependencies across monorepo
pnpm install

# 3. Run automated tests and typechecks
pnpm test
pnpm typecheck
pnpm build

# 4. Start development servers
pnpm dev
# Web app running at http://localhost:3000
# API engine running at http://localhost:3001
```

---

## Using MockLab in 60 Seconds

### 1. Call a Live Mock Endpoint
Every project gets a dedicated mock URL prefix:
```bash
curl -i http://localhost:3001/m/petstore/pets/42
```

Response:
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-MockLab-Rule: Get pet by ID (default example)
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99

{
  "id": 42,
  "name": "Fluffy",
  "tag": "dog"
}
```

### 2. Trigger an Unmatched Route (Near-Miss)
```bash
curl -i http://localhost:3001/m/petstore/pets/unknown
```

Response:
```json
{
  "error": "Not Found",
  "message": "No matching mock rule found",
  "nearMiss": {
    "closestRule": "Get pet by ID",
    "operationId": "GET /pets/{id}",
    "missedField": "path",
    "reason": "Path mismatch: expected numeric id, got 'unknown'"
  }
}
```

### 3. Verify Contracts in CI
Add this step to your GitHub Actions workflow:
```yaml
- name: Verify API Contracts
  run: |
    curl -s -X POST "https://api.yourdomain.com/api/v1/projects/petstore/contract-runs" \
      -H "Authorization: Bearer ${{ secrets.MOCKLAB_API_KEY }}" \
      --fail-with-body
```

---

## Phase 0 Architecture Decision: Upstash vs Managed Redis

Per Plan §12 and the Phase 0 spike assessment:
- **Requirement Analysis**: BullMQ queues, sliding-window rate limiting (`@nestjs/throttler`), and stateful scenario buckets require persistent TCP sockets, Lua script evaluation (`EVALSHA`), and atomic blocking stream operations (`XREADGROUP`, `BRPOPLPUSH`).
- **Upstash Compatibility**: While Upstash offers a Serverless Redis HTTP/REST API, BullMQ and ioredis persistent connection pooling fail over HTTP without custom polling bridges. Upstash's native TCP endpoint supports the Redis protocol, but free-tier quotas (10,000 commands/day) are depleted rapidly by background queue polling heartbeats.
- **Architectural Decision**:
  1. **Local & CI**: Use containerized standard Redis 7 (`redis:7-alpine`) via Docker Compose or GitHub Actions service containers.
  2. **Production Free Tier**: Use managed TCP Redis (e.g. Render Redis, Railway Redis, or Dragonfly) with SSL (`rediss://`).
  3. **Resilient In-Memory Fallback**: When `REDIS_URL` is omitted, `MockStateService` and `QueueSpikeService` gracefully fall back to thread-safe in-memory maps, allowing full local and preview testing with zero external services required.

---

## Production Deployment

### Frontend (Vercel)
The web application is deployed on Vercel at [mocklab-theta.vercel.app](https://mocklab-theta.vercel.app).
Set `NEXT_PUBLIC_API_URL` in your Vercel project environment variables to your deployed backend API URL (e.g. `https://mocklab-api.onrender.com`).

### Backend API (Render Free Tier)
Deploy `apps/api` using the included `render.yaml` Blueprint or `Dockerfile`:
1. Connect `razikuljoni/MockLab` in Render Dashboard.
2. Select **New > Blueprint** and select `render.yaml`.
3. Configure the following environment variables:
   - `DATABASE_URL`: Connection string from free-tier PostgreSQL (Neon or Supabase).
   - `REDIS_URL`: Connection string from TCP Redis.
   - `JWT_SECRET`: Random 64-hex string (`openssl rand -hex 32`).
   - `SECRET_ENCRYPTION_KEY`: Random 64-hex string (`openssl rand -hex 32`).
   - `NEXT_PUBLIC_APP_URL`: `https://mocklab-theta.vercel.app`.

---

## Documentation & References

- [Architecture & Subsystem Design](docs/ARCHITECTURE.md)
- [REST API Reference](docs/API_REFERENCE.md)
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

## License

MIT © [MockLab](https://github.com/razikuljoni/MockLab)
