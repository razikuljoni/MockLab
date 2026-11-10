# Changelog

All notable changes to MockLab will be documented in this file.

## [Phase 3] - Mock Engine Core (2026-11-11)

### Added
- `apps/api`: Dynamic catch-all mock router (`/m/:slug` and `/m/:slug/*`) handling all HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`).
- `apps/api`: `MockEngineService` compiling OpenAPI path templates (e.g. `/pets/{id}` or `:id`) into regex route matchers with named param capture.
- `apps/api`: First-match-wins rule evaluation engine with matcher clauses for method, path, query params, headers, and JSONPath body expressions.
- `apps/api`: Injected latency simulation (`latencyMs`) and WireMock-style fault injection (`empty-body`, `malformed-json`).
- `apps/api`: Mandatory rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) and `X-MockLab-Rule` attached to every mock response.
- `apps/api`: WireMock-style Near-Miss diagnostic report on unmatched requests, returning `404 Not Found` with closest candidate rule and exact missed clauses.
- `apps/api`: Mock authentication guard enforcing API keys on `PRIVATE` projects with `401 Unauthorized` responses.
- `apps/api`: Project status gate returning `503 Service Unavailable` with explanatory JSON when a project is `PAUSED`.

### Verified
- Automated test suite `src/mock/mock-engine-flow.spec.ts` confirms 100% of Phase 3 acceptance criteria: spec example 200 response with `X-MockLab-Rule`, 404 with near-miss report on `/nope`, 401 on unauthenticated private projects, and 503 on paused projects.
- Full monorepo typecheck, lint, and build pass cleanly.

## [Phase 2] - Projects & OpenAPI Import (2026-11-11)

### Added
- `apps/api`: Native `SpecParserUtil` supporting OpenAPI 3.0/3.1 (JSON/YAML) and GraphQL schema parsing, recursive `$ref` dereferencing, circular reference protection, JSONPath validation error localization, and deterministic mock payload generation.
- `apps/api`: `ProjectsModule` with `/api/v1/workspaces/:workspaceId/projects` (create/list), `/api/v1/projects/:projectId`, and `/api/v1/projects/:projectId/status` (Live/Paused toggle).
- `apps/api`: `SpecsModule` with `/api/v1/projects/:projectId/spec/import`, `/api/v1/projects/:projectId/endpoints`, and `/api/v1/projects/:projectId/spec/diff`.
- `apps/api`: Re-import diff engine computing added/changed/removed operations while strictly protecting human-edited rules (`edited: true`).
- `apps/web`: Screen 6 — Projects List (`/projects`) with stats, search filter, 1-click mock URL copy, contract status badge, and "New Project" modal.
- `apps/web`: Screen 7 — Project Overview (`/projects/[id]`) with Live/Paused toggle, Reset State trigger, 24h request counters, P50 response time, active rules, endpoints by tag, and recent traffic.
- `apps/web`: Screen 8 — Import Spec (`/projects/[id]/import`) with Paste URL / Upload File / Paste Raw Spec tabs, drag-and-drop support, JSONPath error diagnostics, and re-import diff preview.
- `apps/web`: Screen 9 — Endpoints List (`/projects/[id]/endpoints`) grouped by tag with method chips (GET/POST/PUT/DELETE), rule counters, hit counters, and contract status.

### Verified
- Automated test suite `src/specs/specs-flow.spec.ts` verifies 100% of Phase 2 criteria: clean Petstore import, JSONPath error pinpointing on invalid specs, and preservation of hand-edited rules on re-import.
- Monorepo typecheck, lint, and Next.js / NestJS builds pass with zero warnings or errors.

## [Phase 1] - Auth, Workspaces, Roles & Public Pages (2026-11-11)

### Added
- `apps/api`: Zero-dependency native cryptographic engine (`CryptoUtil`) featuring Argon2/scrypt password hashing with cryptographic salt, HMAC-SHA256 JWT signing/validation, and AES-256-GCM encryption for provider credentials.
- `apps/api`: `AuthModule` with `/api/v1/auth/signup`, `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/profile`, and `/api/v1/auth/password`.
- `apps/api`: `WorkspacesModule` with workspace creation, member invitations by email, role assignments (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`), and RBAC `RolesGuard`.
- `apps/api`: Automatic pre-seeding of "Petstore Demo" project upon initial workspace creation (§15.7 decision).
- `apps/api`: `DataStoreService` providing dual persistence: Prisma PostgreSQL when database is online, with seamless in-memory fallback for local sandboxed execution.
- `apps/web`: Screen 1 — Landing (`/`) matching Stitch specifications with dark hero, electric Signal Lime accents, live interactive playground preview, 3-step value loop, feature grid, and pricing teaser.
- `apps/web`: Screen 2 — Pricing (`/pricing`) displaying Free ($0) active tier with 5k req/mo, 100 runs, 14-day logs (2,500 rows), and Pro & Team tiers labeled as "Pricing TBD / Coming Soon" with limits (§15.2 & §15.4 decisions), full comparison table, and FAQ accordion.
- `apps/web`: Screen 3 — Docs (`/docs`) covering 5-minute quickstart, OpenAPI/GraphQL importing, first-match-wins rule priority, stateful buckets, contract tests, GitHub Actions CI snippet, and rate limits.
- `apps/web`: Screen 4 — Auth (`/login`, `/signup`, `/forgot`) with inline password validation rules checklist, workspace slug generator, and pre-load demo project toggle.
- `apps/web`: Screen 22 — Account (`/account`) with profile settings, password update form, GitHub connected status, theme switcher (Dark/Light/System), keyboard shortcuts sheet, and personal CLI token.
- `packages/shared`: Auth schemas (`UserSignupSchema`, `UserLoginSchema`, `WorkspaceInviteSchema`) and updated plan limits reflecting owner decisions.

### Verified
- Acceptance test suite `src/auth/auth-flow.spec.ts` passes 100%: signup -> workspace creation -> email invite -> second user login -> role verification.
- `RolesGuard` strictly prevents `VIEWER` from accessing keys (403 Forbidden).
- Monorepo typecheck, lint, and production builds (`next build` & `nest build`) clean across all packages.

## [Phase 0] - Scaffold, Spine & Upstash Redis Spike (2026-11-10)

### Added
- Monorepo structure using pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`).
- `packages/shared`: Design system tokens (Signal Lime on Graphite), HTTP method chip styles, Zod validation schemas, and tier pricing limits.
- `apps/web`: Next.js 15 App Router scaffold with Tailwind v4 `@theme` configuration, `next-themes` dark/light toggle, persistent 18-link sidebar navigation, top bar with Mock/Real environment switcher, and placeholder shells for Landing, Pricing, Docs, and Dashboard.
- `apps/api`: NestJS 11 backend setup with Prisma ORM schema (§8 + GraphQL extension), health check endpoint (`/health`), and BullMQ queue spike service.
- `docker-compose.yml`: Local container orchestration for PostgreSQL 16 and Redis 7 Alpine.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) for linting, typechecking, and automated testing.

### Verified
- Upstash BullMQ spike documented: requires standard TCP Redis for blocking worker operations (`BLMOVE`/`BRPOPLPUSH`), satisfied by local Docker Redis and standard TCP managed Redis in production.
- Monorepo builds, typechecks, and tests all green (`pnpm typecheck`, `pnpm test`, `pnpm build`).
- `/health` endpoint verified returning 200 OK.
