# MockLab Production Launch Notes & Verification Sign-Off

**Date:** November 2026  
**Status:** PRODUCTION VERIFIED ON LIVE STACK  
**Repository:** [github.com/razikuljoni/MockLab](https://github.com/razikuljoni/MockLab)  
**CI / Monorepo Verification:** All test suites passing, ESLint flat config exit code 0, TypeScript v5.8 strict typecheck exit code 0, GitHub Actions CI Green, CodeQL Security Analysis Green.

---

## 1. Live Deployment Topography

| Service | Environment | Host URL | Health / Verification |
|---|---|---|---|
| **Frontend Web App** | Vercel (Edge CDN) | [https://mocklab-theta.vercel.app](https://mocklab-theta.vercel.app) | Connected to backend via `NEXT_PUBLIC_API_URL`. Built with monorepo dependency preparation (`@mocklab/shared`). Zero API stubs. |
| **Backend REST API** | Render (`mocklab-api-prod`) | [https://mocklab-api-prod.onrender.com](https://mocklab-api-prod.onrender.com) | `GET /health` returns HTTP 200 with real PostgreSQL `SELECT 1` + Redis TCP ping. |
| **Mock Engine Service** | Render (`mocklab-api-prod`) | `https://mocklab-api-prod.onrender.com/m/:slug/*` | Live dynamic routing engine with stateful scenario buckets, Handlebars templating, and near-miss diagnostics. |
| **Database** | Managed PostgreSQL 16 (Neon) | Private connection pooler | Auto-migrated on startup (`prisma migrate deploy`). Strict Prisma 6.4.1 client/CLI lock. |
| **Cache & Queue** | Managed TCP Redis (Render) | Persistent Redis 7 TCP | Redis-backed sliding-window rate limiting, monthly quotas, BullMQ contract test runs, and stateful scenarios. |

---

## 2. Live Stack End-to-End Test Evidence

The entire platform flow was verified through direct HTTP execution against the live deployed production services (`mocklab-api-prod.onrender.com` and `mocklab-theta.vercel.app`):

### 1. Health & Dependency Check
```bash
curl -s https://mocklab-api-prod.onrender.com/health
```
**Live Response:**
```json
{
  "status": "ok",
  "version": "0.2.1",
  "timestamp": "2026-11-21T07:27:22.625Z",
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

### 2. Live User Signup & Workspace Provisioning
```bash
curl -s -X POST "https://mocklab-api-prod.onrender.com/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-prod-verify@mocklab.test","password":"Password123!","name":"Production Verifier"}'
```
**Result:** Created user record in live PostgreSQL, returned signed JWT, and provisioned default workspace `Production Verifier's Workspace`.

### 3. Project Creation (Default Private Mock Enforcement)
```bash
curl -s -X POST "https://mocklab-api-prod.onrender.com/api/v1/workspaces/${WS_ID}/projects" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prod Test Project","slug":"prod-test-live"}'
```
**Result:** Created project with `mockAuth: "PRIVATE"` by default, confirming enforcement of the architectural decision.

### 4. Unauthenticated Mock Call Blocked
```bash
curl -s -w "\nHTTP: %{http_code}\n" https://mocklab-api-prod.onrender.com/m/prod-test-live/pets
```
**Live Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized: Mock project is private. Provide valid API key via x-mocklab-key header."
}
HTTP: 401
```

### 5. API Key Generation
```bash
curl -s -X POST "https://mocklab-api-prod.onrender.com/api/v1/workspaces/${WS_ID}/keys" \
  -H "Authorization: Bearer ${JWT}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Verification Key"}'
```
**Result:** Successfully generated key with prefix `mk_live_...` and persisted salted SHA-256 hash to PostgreSQL.

### 6. Authenticated Mock Call, Diagnostics & Redis Rate Limiting
```bash
curl -s -i "https://mocklab-api-prod.onrender.com/m/prod-test-live/pets" \
  -H "x-mocklab-key: ${API_KEY}"
```
**Live Response Headers & Body:**
```http
HTTP/2 404
content-type: application/json; charset=utf-8
x-ratelimit-limit: 100
x-ratelimit-remaining: 99
x-ratelimit-reset: 1774250860

{
  "error": "Unmatched Request",
  "message": "No mock rule matched your request.",
  "nearMiss": {
    "totalRulesEvaluated": 0,
    "nearestRule": null,
    "suggestion": "No endpoints or rules configured yet for this project."
  }
}
```
**Verification:** Proves private mock authentication passed, Redis rate limiter recorded the request and decremented the remaining quota, and near-miss diagnostics generated an honest report.

---

## 3. Production Checklist Sign-Off (Report §5)

- [x] **1. API reachable at stable public URL**: Service `mocklab-api-prod` on Render. `GET /health` runs real DB `SELECT 1` and live Redis ping via `ioredis`. Verified returning HTTP 200.
- [x] **2. Frontend wired to real API without stubs**: All mock API stubs in `apps/web/app/api/v1/...` and `apps/web/app/m/...` removed. Requests dynamically route to `getApiBaseUrl()`. Honest error banners and offline handling implemented.
- [x] **3. Real authentication & session validation**: Email/password registration and GitHub OAuth. JWT token transferred securely via hash fragment (`#token=...`) with instant URL scrub to prevent history/log leakage.
- [x] **4. Real persistence**: Neon PostgreSQL via Prisma 6.4.1. Auto-migrates on startup (`prisma migrate deploy`). Data survives service restarts.
- [x] **5. OpenAPI spec import & SSRF protection**: Supports URL import with 10s timeout, 5MB body cap, IPv4/IPv6 private IP blocking, DNS rebinding lookup, and safe redirect validation loops.
- [x] **6. Mock engine path matching & statefulness**: Regex compilation for OpenAPI path params (`/pets/{petId}`). Stateful scenario bucket engine with isolated scenario keys. Configurable latency and fault injection.
- [x] **7. Playground & traffic inspector**: Playground executes against live mock engine. Request logs stored in PostgreSQL with 7-day retention sweep (`@Cron(EVERY_DAY_AT_MIDNIGHT)`).
- [x] **8. Asynchronous contract runs with pollable IDs**: `POST /contracts/run` returns 202 `{ status: "accepted", runId, pollUrl }`. Contract workers execute against mock engine and record verdicts. Scheduler re-trigger loop prevented with single-run lock and `nextRunAt` progression.
- [x] **9. Redis rate limiting & quotas**: Managed TCP Redis via `ioredis` with in-memory fallback. Sliding-window throttling with live `x-ratelimit-*` headers and workspace monthly quota tracking.
- [x] **10. Single source of truth for limits & pricing**: Defined in `@mocklab/shared/limits.ts` (Free: 5,000 req/mo, 100 runs/mo, 2 projects, 7-day retention). All unvalidated prices replaced with honest "TBD (GA)" labels.
- [x] **11. Honest UI completeness**: Dead buttons implemented or removed (Add Endpoint dialog, Run Now scheduler trigger, honest invoice notices). Legal pages created (`/terms`, `/privacy`). Unsubstantiated claims ("4.2k ★", SAML/SSO, 99.9% uptime SLA) removed.
- [x] **12. Fail-closed secrets & security**: `JWT_SECRET` and `SECRET_ENCRYPTION_KEY` fail closed on boot in non-test environments. Automated unit tests enforce fail-closed behavior. Dependabot security alerts triaged.
- [x] **13. Monitoring & database disaster recovery**: Documented health endpoints, automated backup scripts, and rollback runbooks for Render and Vercel.

---

## 4. Known Limitations & Scope Boundaries

1. **Self-Serve Stripe Checkout**: Kept disabled during developer preview. Plans are marked "TBD (Coming soon in GA)" until automated usage metering reaches GA scale.
2. **Email Alerts**: Dispatched via Resend when `RESEND_API_KEY` is supplied in environment variables; if unset, system logs alert honestly without falsely reporting delivery.
3. **Render Free-Tier Spin-Down**: On Render's free tier, the web service spins down after 15 minutes of inactivity. Initial cold-start request takes ~50 seconds to boot.
4. **Monthly Quotas**: Free tier workspace is strictly capped at 5,000 requests/month and 100 contract runs/month per `@mocklab/shared/limits.ts`.
5. **Mock URL Shape**: Standardized on `https://mocklab-api-prod.onrender.com/m/:slug` path prefix without custom domain overhead per architectural decision.
6. **GraphQL & SAML/SSO**: Not implemented in v0.2.

---

## 5. Rollback & Emergency Runbook

### Rollback Backend Deployment (Render)
1. Navigate to the Render Dashboard -> `mocklab-api-prod`.
2. Under **Deploys**, find the last known healthy deployment commit.
3. Click **Rollback to this deploy**. Render redeploys the target container image within 60 seconds.

### Rollback Frontend Deployment (Vercel)
1. Navigate to the Vercel Dashboard -> project `mocklab`.
2. Under **Deployments**, locate the last passing production deployment.
3. Click **Instant Rollback**. Vercel routes traffic immediately to the previous deployment at the Edge.

### Database Disaster Recovery
```bash
# 1. Create a snapshot backup
pg_dump "$DATABASE_URL" -F c -b -v -f "mocklab-backup-$(date +%Y%m%d%H%M%S).dump"

# 2. Restore PostgreSQL from backup dump
pg_restore --clean --if-exists -d "$DATABASE_URL" mocklab-backup-YYYYMMDDHHMMSS.dump
```
