# Changelog

All notable changes to MockLab will be documented in this file.

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
