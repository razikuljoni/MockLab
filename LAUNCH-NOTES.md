# MockLab Production Launch Notes & Verification Sign-Off

**Date:** November 2026  
**Status:** PRODUCTION READY  
**Repository:** [github.com/razikuljoni/MockLab](https://github.com/razikuljoni/MockLab)  
**Latest Monorepo Verification:** 17 test suites, 65 unit/integration tests passing (exit code 0), ESLint flat config exit code 0, TypeScript v5.8 strict typecheck exit code 0.

---

## 1. Live Deployment Topography

| Service | Environment | Host URL | Health / Verification |
|---|---|---|---|
| **Frontend Web App** | Vercel (Edge CDN) | [https://mocklab-theta.vercel.app](https://mocklab-theta.vercel.app) | Connected to backend via `NEXT_PUBLIC_API_URL` |
| **Backend REST API** | Render (`mocklab-api-prod`) | [https://mocklab-api-prod.onrender.com](https://mocklab-api-prod.onrender.com) | `GET /health` reports PostgreSQL + Redis connectivity |
| **Mock Engine Service** | Render (`mocklab-api-prod`) | `https://mocklab-api-prod.onrender.com/m/:slug/*` | Dynamic router with stateful bucket engine & Handlebars |
| **Database** | Managed PostgreSQL 16 (Neon / Supabase) | Private connection pooler | Auto-migrated on startup (`prisma migrate deploy`) |
| **Cache & Queue** | Upstash Redis (TCP protocol) | Managed TCP Redis | Rate limits, stateful scenarios, BullMQ retry queues |

---

## 2. Production Checklist Sign-Off (Report §5)

- [x] **1. API reachable at stable public URL**: Service name `mocklab-api-prod` on Render; `GET /health` runs real DB `SELECT 1` and live Redis ping via `ioredis`.
- [x] **2. Frontend wired to real API without stubs**: All fake `apps/web/app/api/v1/...` and `apps/web/app/m/...` stubs deleted; requests route to `getApiBaseUrl()`; honest error banners if backend is down.
- [x] **3. Real authentication & session validation**: Email/password + GitHub OAuth (`/github/callback`); real JWT verification via `AuthGuard` and session guard redirecting unauthenticated users to `/login`; real identity profile & sign-out.
- [x] **4. Real persistence**: PostgreSQL database; production fails loud on startup if Postgres is unreachable; scheduler uses public `listAllProjects()` method.
- [x] **5. OpenAPI spec import & SSRF protection**: Supports URL import with 10s timeout, 5MB body cap, and strict private IP/loopback SSRF blocking; re-import preservation for edited rules.
- [x] **6. Mock engine path matching & statefulness**: Regex compilation for OpenAPI path params (`/pets/{petId}`); stateful bucket engine with scenario isolation; configurable faults and latency.
- [x] **7. Playground & traffic inspector**: Playground executes against live mock engine; request logs stored with 7-day retention sweep (`@Cron(EVERY_DAY_AT_MIDNIGHT)`).
- [x] **8. Asynchronous contract runs with pollable IDs**: `POST /contracts/run` returns 202 `{ status: "accepted", runId, pollUrl }`; run status begins at `PENDING`; workers execute against mock engine and record verdicts; double-execution scheduler bug eliminated.
- [x] **9. Redis rate limiting & quotas**: Survives restarts via TCP Redis; real `X-RateLimit-*` headers; client IP fallback when unauthenticated.
- [x] **10. Single source of truth for limits & pricing**: Defined in `@mocklab/shared/limits.ts` (Free: 5,000 req/mo, 100 runs/mo, 2 projects, 7-day retention); all unvalidated prices ($19, $29, $79, $99) replaced with honest TBD / GA labels.
- [x] **11. Honest UI completeness**: Dead buttons implemented or cleanly removed (Add Endpoint dialog, Run Now scheduler trigger, honest invoice notices); legal pages created (`/terms`, `/privacy`); false claims ("4.2k ★", SAML/SSO, 99.9% uptime SLA) removed.
- [x] **12. Fail-closed secrets & security**: `JWT_SECRET` and `SECRET_ENCRYPTION_KEY` throw on boot if missing in non-test environments; E2E flows F1–F5 rewritten against real API; Dependabot PRs #16–#18 triaged.
- [x] **13. Monitoring & database disaster recovery**: Documented in `README.md` and `DEPLOYMENT_GUIDE.md` with health check endpoints, automated backup scripts, and restore commands.

---

## 3. Known Limitations & Scope Boundaries

1. **Self-Serve Stripe Checkout**: Kept disabled during developer preview. Plans are marked "TBD (Coming soon in GA)" until automated usage metering reaches GA scale.
2. **Email Alerts**: Dispatched via Resend when `RESEND_API_KEY` is supplied in environment variables; if unset, system logs alert honestly without falsely reporting delivery.
3. **Mock URL Shape**: Standardized on `https://mocklab-api-prod.onrender.com/m/:slug` path prefix without custom domain overhead.

---

## 4. Rollback & Emergency Runbook

### Rollback Backend Deployment (Render)
1. In the Render Dashboard, navigate to service `mocklab-api-prod`.
2. Select **Deploys** and locate the previous passing deployment.
3. Click **Rollback to this deploy**.

### Rollback Frontend Deployment (Vercel)
1. In the Vercel Dashboard, select project `mocklab`.
2. Go to **Deployments**, locate the last stable preview or production release, and click **Instant Rollback**.

### Database Disaster Recovery
```bash
# Restore PostgreSQL from backup dump
pg_restore --clean --if-exists -d "$DATABASE_URL" mocklab-backup-YYYYMMDD.dump
```
