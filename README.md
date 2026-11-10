# MockLab

> Design the API. Mock it in seconds. Prove it in CI.

MockLab is a developer-first API mocking and contract-testing platform supporting OpenAPI 3.0/3.1 and GraphQL schemas.

## Tech Stack
- **Web**: Next.js 15 (App Router), React 19, Tailwind v4 ("Signal Lime on Graphite" design system), `next-themes`.
- **API**: NestJS 11, Prisma ORM, BullMQ queue engine, ioredis.
- **Shared**: Zod schemas, TypeScript strict types, design system tokens.
- **Database & Queue**: PostgreSQL 16 + Redis 7 (via Docker Compose).

## Design System
- **Theme**: "Signal Lime on Graphite" (§3.1)
- **Primary Accent**: Electric Signal Lime `#BFFF3C` (dark default) / `#65A30D` (light)
- **Background Surfaces**: `#101208` (app bg), `#171A10` (panels/cards), `#0C0E07` (code editor)
- **Fonts**: Geist / Inter (Display / UI) + JetBrains Mono (Code)

## BullMQ Redis Spike Findings (Phase 0)
- **Upstash REST Redis**: Upstash free tier uses HTTP/REST semantics which does not support long-lived blocking Redis commands (`BLMOVE`, `BRPOPLPUSH`) required by BullMQ background workers.
- **Decision**:
  - **Local Development**: Standard TCP Redis 7 container via `docker compose up -d` on port `6379`.
  - **Production Free-Tier**: Standard managed TCP Redis instance (e.g. Render / Railway / Aiven free tier) or Upstash standard Redis with TCP/TLS endpoint.

## Local Quickstart

```bash
# 1. Start database and Redis services
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client
pnpm --filter @mocklab/api prisma:generate

# 4. Run tests and typechecks
pnpm test
pnpm typecheck
pnpm build

# 5. Start development servers
pnpm dev
# Web running at http://localhost:3000
# API running at http://localhost:3001
```

## Phase Status
- [x] **Phase 0**: Scaffold + Spine + Redis Spike
- [ ] **Phase 1**: Auth, Workspaces, Roles, Public Pages
- [ ] **Phase 2**: Projects + OpenAPI Import
- [ ] **Phase 3**: Mock Engine Core
- [ ] **Phase 4**: Playground (Main UI)
- [ ] **Phase 5**: Rules Editor + Templating + Faults
- [ ] **Phase 6**: Stateful Scenarios & Buckets
- [ ] **Phase 7**: Traffic Inspector
- [ ] **Phase 8**: Contract Tests (Expectations, Runner, Diff)
- [ ] **Phase 9**: Schedules + CI Integration
- [ ] **Phase 10**: API Keys, Rate Limits, Team, Settings, Billing
- [ ] **Phase 11**: Polish, Accessibility, Docs, Deploy, Demo
