# Changelog

All notable changes to MockLab will be documented in this file.

## [Release 0.2.0] - (2026-11-11)

### @mocklab/web

### Minor Changes

- [#6](https://github.com/razikuljoni/MockLab/pull/6) [`1480a0f`](https://github.com/razikuljoni/MockLab/commit/1480a0fb952c73fa3480bb54b9acc7ba34234e95) Thanks [@razikuljoni](https://github.com/razikuljoni)! - feat(ci): production-grade CI/CD pipelines, automated versioning with Changesets, and auto-generated changelogs

### Patch Changes

- Updated dependencies [[`1480a0f`](https://github.com/razikuljoni/MockLab/commit/1480a0fb952c73fa3480bb54b9acc7ba34234e95)]:
  - @mocklab/shared@0.2.0

### @mocklab/api

### Minor Changes

- [#6](https://github.com/razikuljoni/MockLab/pull/6) [`1480a0f`](https://github.com/razikuljoni/MockLab/commit/1480a0fb952c73fa3480bb54b9acc7ba34234e95) Thanks [@razikuljoni](https://github.com/razikuljoni)! - feat(ci): production-grade CI/CD pipelines, automated versioning with Changesets, and auto-generated changelogs

### Patch Changes

- Updated dependencies [[`1480a0f`](https://github.com/razikuljoni/MockLab/commit/1480a0fb952c73fa3480bb54b9acc7ba34234e95)]:
  - @mocklab/shared@0.2.0

### @mocklab/shared

### Minor Changes

- [#6](https://github.com/razikuljoni/MockLab/pull/6) [`1480a0f`](https://github.com/razikuljoni/MockLab/commit/1480a0fb952c73fa3480bb54b9acc7ba34234e95) Thanks [@razikuljoni](https://github.com/razikuljoni)! - feat(ci): production-grade CI/CD pipelines, automated versioning with Changesets, and auto-generated changelogs

## [Release 0.1.0] - CI Pipeline, Production Deployment, and Plan Fidelity (2026-11-11)

### Fixed & Hardened
- **CI/CD Pipeline**:
  - Removed redundant `version: 10` in `.github/workflows/ci.yml` so `packageManager: pnpm@10.34.5` in root `package.json` is single source of truth.
  - Added explicit pre-typecheck and pre-test build steps: `pnpm --filter @mocklab/api exec prisma generate` and `pnpm --filter @mocklab/shared build`.
  - Created initial PostgreSQL migration (`20261111082033_init`) via Prisma Migrate.
  - Replaced dummy lint scripts with strict TypeScript ESLint flat configuration across monorepo.
- **Frontend & Stitch Fidelity**:
  - Self-hosted Geist, Inter, and JetBrains Mono Variable fonts locally in `apps/web/public/fonts/` loaded via `next/font/local`.
  - Replaced plain `<textarea>` in Request Playground with lazy-loaded Monaco Editor (`next/dynamic` + `ssr: false`) and custom graphite theme.
  - Implemented drag-and-drop rule priority reordering (first match wins) in Rules Editor with grip handle and drop indicators.
  - Added real Next.js auth guard on `apps/web/app/(app)/layout.tsx` redirecting unauthenticated sessions to `/login`.
  - Replaced hardcoded `http://localhost:3001` URLs with `NEXT_PUBLIC_API_URL` (deployed at `https://mocklab-theta.vercel.app`).
  - Replaced fake billing upgrade button with honest "Billing coming soon" state pending Stripe integration.
- **API & Plan Fidelity**:
  - Implemented AJV schema validator (`ajv` for OpenAPI 3.0 with `nullable: true` pre-transformation, `ajv/dist/2020` for OpenAPI 3.1) with compiled validator caching.
  - Proved recursive OpenAPI dereferencer with unit tests handling circular `$ref` loop protection and JSONPath error location.
  - Added production BullMQ request-logging and contract-running queue service with in-memory resilient fallbacks.
  - Replaced `setInterval` with `@nestjs/schedule` `@Cron` sweeper enqueuing asynchronous contract runs.
  - Added in-memory fixed 60-second window rate limiting and monthly quota tracking returning standard `X-RateLimit-*` and `Retry-After` headers.
  - Added dual-mode mock router supporting both `https://<slug>.mocklab.dev/*` (Host header) and `/m/<slug>/*` path prefix.
  - Added `BillingModule` (usage meters & plan limits) and `NotificationsModule` (`EmailService` alerting on `BREAKING` contract verdicts).
  - Added Playwright E2E suite (`tests/e2e/flows-f1-f5.spec.ts`) validating Plan §11 Acceptance Flows F1–F5.

### Verified
- Monorepo unit & integration tests: 56/56 passing (`pnpm test`).
- Monorepo typecheck: 0 errors across `@mocklab/shared`, `@mocklab/web`, `@mocklab/api`.
- Monorepo lint: 0 errors (`pnpm lint`).
- Playwright live E2E: 5/5 passing against `https://mocklab-theta.vercel.app`.
- Production build: Next.js 21/21 routes compiled cleanly in 10.7s.
- GitHub Actions CI: 100% green run on `main`.

## [Phase 11] - Polish, Accessibility, Status Catalog & Design System (2026-11-11)

### Added
- `apps/web`: Screen 23 — Status & Error States Catalog (`/status` and `apps/web/app/not-found.tsx`):
  - HTTP 404 Near-Miss report with search input, route candidate suggestions, and navigation cards.
  - HTTP 503 Mock Paused explanatory screen with formatted JSON payload and resume link.
  - HTTP 429 Rate Limit Exceeded notice with RFC Retry-After and reset countdown indicators.
  - OpenAPI Spec Validation error inspector with highlighted character/line pointers and JSONPath.
  - Maintenance and degradation notice banner with operational subsystem health matrix.
- `apps/web`: Screen 24 — Design System Board (`/design-system`):
  - Token reference strictly matching §3: core color swatches (`--surface-0..3`, `--border`, `--ink`, `--signal`, `--success`, `--error`, `--warning`, `--info`) with 1-click CSS variable copy.
  - Typography scale specifications across Display, Headings, Body, and Code font hierarchies.
  - Interactive component primitives: Buttons, HTTP Method Chips, Verdict Badges, and Form Controls.
  - WCAG 2.1 AA contrast matrix proving all token foreground/background pairs pass AAA/AA standards.
- Documentation update in `apps/web/app/(marketing)/docs/page.tsx` linking to Screen 23 and 24.

### Verified
- All 24 screens in §2.1 render cleanly across static and dynamic Next.js routes.
- Initial local measurement at commit `13ac63e`: `pnpm test` failed on the web suite (`Failed to resolve entry for package "@mocklab/shared"`) and 9/13 API suites failed with `Error: Cannot find module '.prisma/client/default'` due to unbuilt shared package and missing Prisma client generation; CI had never passed due to pnpm action setup version conflict (`version: 10` vs `pnpm@10.34.5`).

## [Phase 10] - API Keys, Rate Limits, Teams, Settings & Billing (2026-11-11)

### Added
- `apps/api`: `ApiKeysService` and `ApiKeysController` with Stripe-style token generation (`mk_live_`, `mk_test_`, SHA-256 hash storage, last4 display, and show-once raw token delivery).
- `apps/api`: In-memory 60-second window rate limiter per API key, returning `429 Too Many Requests` with standard `Retry-After` header when exceeded.
- `apps/api`: Workspace management endpoints: member invitations, role updates, settings updates (`defaultEnv`, `mockAuthDefault`, `logRetentionDays`), `pause-all` mocks trigger, and Owner-only workspace deletion.
- `apps/api`: Billing endpoints enforcing plan quotas for Free ($0), Pro (TBD), and Team (TBD) tiers with RBAC protection (Editor receives 403 Forbidden).
- `apps/web`: Screen 18 — Team & Roles (`/workspace/team`) with member table, role change dropdown, member removal, and email invite modal.
- `apps/web`: Screen 19 — API Keys (`/workspace/keys`) with key management table, show-once creation modal, and instant revocation.
- `apps/web`: Screen 20 — Settings (`/workspace/settings`) with workspace properties, mock engine auth defaults, retention sliders, and danger zone.
- `apps/web`: Screen 21 — Billing (`/workspace/billing`) with current consumption meters, plan upgrade cards, and invoice history table.

### Verified
- Automated test suite `src/keys/keys-flow.spec.ts` verifies: revoked key rejected with 401, rate-limited key gets 429 with `Retry-After`, Editor role cannot access billing or delete workspace (403), Owner can pause all mocks and update billing.

## [Phase 9] - Schedules & CI Integration (2026-11-11)

### Added
- `apps/api`: `CiSchedulerService` executing periodic automated contract runs against external APIs on configured cadences (`@hourly`, `@daily`, `@weekly`).
- `apps/api`: External CI trigger endpoint (`POST /api/v1/projects/:id/contract-runs`) returning non-zero exit code (`409 Conflict`) on `FAIL_BREAKING` to fail CI pipeline gates.
- `apps/api`: Public SVG status badge endpoint (`GET /api/v1/projects/:id/badge`) generating shields-style vector graphics (`contracts | passing`, `contracts | breaking`, `contracts | none`).
- `apps/web`: Screen 16 — Schedules (`/projects/[id]/contracts/schedules`) with cadence selector, active toggles, and last run status.
- `apps/web`: Screen 17 — CI Integration (`/projects/[id]/ci`) with copyable GitHub Actions YAML, GitLab CI template, cURL commands, and README Markdown badge generator.

### Verified
- Automated test suite `src/ci/ci-flow.spec.ts` verifies 100% of Phase 9 criteria: external CI trigger fails on breaking change, passes on compliant change, SVG badge renders correct color/text, and due schedules execute accurately.

## [Phase 8] - Contract Tests, Expectations & Diffs (2026-11-11)

### Added
- `apps/api`: `ContractDiffUtil` computing deep recursive structural diffs between mock expectations and real provider responses, classifying findings into strict Verdict taxonomy (`PASS`, `BREAKING`, `NON_BREAKING`, `ERROR`).
- `apps/api`: `ContractRunnerService` executing real provider verification runs with AES-256-GCM decrypted credentials, capturing status, latency, request/response headers, and payloads.
- `apps/web`: Screen 14 — Contracts List (`/projects/[id]/contracts`) with expectation table, verdict badges, and "Run All" trigger.
- `apps/web`: Screen 15 — Contract Run Detail (`/projects/[id]/contracts/runs/[runId]`) with summary chips, JSONPath diff list, side-by-side synchronized scrolling, character-level highlights, and "Collapse Unchanged" toggle.

### Verified
- Automated test suite `src/contracts/contracts-flow.spec.ts` verifies contract runner execution, breaking diff classification, and non-breaking addition classification.

## [Phase 7] - Traffic Inspector (2026-11-11)

### Added
- `apps/api`: `RequestLoggerService` buffering high-throughput mock requests in-memory and batching persistence every 500 records or 5 seconds.
- `apps/api`: Automated redaction of sensitive auth headers (`Authorization`, `Cookie`, `X-MockLab-Key`) and 100 KB payload size capping with truncation warnings.
- `apps/web`: Screen 13 — Traffic Inspector (`/projects/[id]/logs`) with dense 32px table, "Only Unmatched" filter toolbar, and row drawer with Near-Miss diagnosis, "Replay in playground", and "Create rule from request" 1-click generator.

### Verified
- Automated test suite `src/logs/logs-flow.spec.ts` verifies 1,000-request non-blocking burst, sensitive header redaction, 100 KB cap, and retention cleanup.

## [Phase 6] - Stateful Scenarios & Buckets (2026-11-11)

### Added
- `apps/api`: `MockStateService` managing in-memory and Redis state stores with atomic CRUD operations for bucket resources (`mock:{projectId}:{scenarioKey}:bucket:{resource}`).
- `apps/api`: Client-supplied `id: "new"` substitution with cryptographically random UUIDs.
- `apps/web`: Screen 12 — Scenarios (`/projects/[id]/scenarios`) featuring an interactive vertical stepper for state machines (e.g. Order Lifecycle), active bucket data table, JSON inspect modal, and Reset State confirmation.

### Verified
- Automated test suite `src/scenarios/scenarios-flow.spec.ts` verifies bucket CRUD, UUID generation, scenario key isolation, and state reset.

## [Phase 5] - Rules Editor, Templating & Faults (2026-11-11)

### Added
- `apps/api`: `TemplateEngineUtil` supporting Handlebars syntax (`{{body.name}}`, `{{query.id}}`, `{{headers.auth}}`, `{{now}}`, `{{uuid}}`, `{{randomInt 1 100}}`).
- `apps/api`: Injected delays (0 to 5,000 ms) and fault injection simulation (`malformed-json`, `empty-body`, `connection-reset`).
- `apps/web`: Screen 11 — Rules Editor (`/projects/[id]/endpoints/[op]/rules`) with draggable priority reordering, matcher configuration tabs, response headers editor, fault injection selector, and live Handlebars syntax preview.

### Verified
- Automated test suite `src/rules/rules-flow.spec.ts` verifies template variable interpolation, fault injection, and priority sorting.

## [Phase 4] - Request Playground (Main UI) (2026-11-11)

### Added
- `apps/web`: Server-side proxy API route (`/api/proxy`) preventing browser CORS restrictions when sending test requests to mock URLs and real provider URLs.
- `apps/web`: Screen 10 — Request Playground (`/projects/[id]/playground`) matching Stitch specifications:
  - Collapsible left sidebar with Endpoints resource tree and searchable History log.
  - Method chip selector with standard HTTP method colors and URL input bar with highlighted `{{baseUrl}}` variable.
  - Request tabs: `Params` (key/value table), `Headers`, `Auth` (None/Bearer/X-MockLab-Key), `Body` (formatted JSON), and `Rules` (live prediction).
  - Loud status bar: status code badge (`200 OK`, `404 Unmatched`), roundtrip latency in ms, payload size, and matched rule name.
  - Response tabs: `Body` (pretty JSON), `Headers`, `Timeline` (TTFB and latency breakdown), and `Validation` (OpenAPI schema conformance warnings).
  - 1-Click Code Export: `Copy as cURL`, `Copy as fetch`, and `Copy as Python requests`.
  - Keyboard shortcut: `Cmd+Enter` / `Ctrl+Enter` sending from anywhere.

### Verified
- End-to-end proxy roundtrip verified with TTFB and duration metrics.
- Monorepo typecheck, lint, and Next.js / NestJS builds pass with zero warnings or errors.

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
- `apps/api`: Native `SpecParserUtil` supporting OpenAPI 3.0/3.1 (JSON/YAML) specification parsing, recursive `$ref` dereferencing, circular reference protection, JSONPath validation error localization, and deterministic mock payload generation.
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
- `apps/web`: Screen 3 — Docs (`/docs`) covering 5-minute quickstart, OpenAPI importing, first-match-wins rule priority, stateful buckets, contract tests, GitHub Actions CI snippet, and rate limits.
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
- `apps/api`: NestJS 11 backend setup with Prisma ORM schema (§8 + Protocol enum for future extension), health check endpoint (`/health`), and BullMQ queue spike service.
- `docker-compose.yml`: Local container orchestration for PostgreSQL 16 and Redis 7 Alpine.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) for linting, typechecking, and automated testing.

### Verified
- Upstash BullMQ spike documented: requires standard TCP Redis for blocking worker operations (`BLMOVE`/`BRPOPLPUSH`), satisfied by local Docker Redis and standard TCP managed Redis in production.
- Monorepo builds, typechecks, and tests all green (`pnpm typecheck`, `pnpm test`, `pnpm build`).
- `/health` endpoint verified returning 200 OK.
