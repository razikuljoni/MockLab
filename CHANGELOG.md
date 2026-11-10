# Changelog

All notable changes to MockLab will be documented in this file.

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
