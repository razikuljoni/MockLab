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
- [x] **Phase 0**: Scaffold + Spine + Redis Spike (`feat/phase-0-scaffold-spine`)
- [x] **Phase 1**: Auth, Workspaces, Roles, Public Pages (`feat/phase-1-auth-workspaces-public-pages`)
- [x] **Phase 2**: Projects + OpenAPI Import (`feat/phase-2-projects-openapi-import`)
- [x] **Phase 3**: Mock Engine Core (`feat/phase-3-mock-engine-core`)
- [x] **Phase 4**: Playground (`feat/phase-4-playground-main-ui`)
- [x] **Phase 5**: Rules Editor + Templating + Faults (`feat/phase-5-rules-editor-templating-faults`)
- [x] **Phase 6**: Stateful Scenarios & Buckets (`feat/phase-6-stateful-scenarios-buckets`)
- [x] **Phase 7**: Traffic Inspector (`feat/phase-7-traffic-inspector`)
- [x] **Phase 8**: Contract Tests (`feat/phase-8-contract-tests`)
- [x] **Phase 9**: Schedules + CI Integration (`feat/phase-9-schedules-ci`)
- [x] **Phase 10**: API Keys, Rate Limits, Team, Settings, Billing (`feat/phase-10-keys-limits-team-billing`)
- [x] **Phase 11**: Polish, Accessibility, Docs, Deploy, Demo (`feat/phase-11-polish-a11y-demo`)

## Complete 24-Screen Checklist (§2.1)
| Screen | Name | Route | Status |
|---|---|---|---|
| Screen 1 | Landing Page | `/` | Complete |
| Screen 2 | Pricing | `/pricing` | Complete |
| Screen 3 | Documentation | `/docs` | Complete |
| Screen 4 | Auth (Login, Signup, Forgot) | `/login`, `/signup`, `/forgot` | Complete |
| Screen 5 | Dashboard | `/dashboard` | Complete |
| Screen 6 | Projects List | `/projects` | Complete |
| Screen 7 | Project Overview | `/projects/[id]` | Complete |
| Screen 8 | Import OpenAPI Spec | `/projects/[id]/import` | Complete |
| Screen 9 | Endpoints List | `/projects/[id]/endpoints` | Complete |
| Screen 10 | Request Playground | `/projects/[id]/playground` | Complete |
| Screen 11 | Rules Editor | `/projects/[id]/endpoints/[op]/rules` | Complete |
| Screen 12 | Stateful Scenarios | `/projects/[id]/scenarios` | Complete |
| Screen 13 | Traffic Inspector | `/projects/[id]/logs` | Complete |
| Screen 14 | Contract Tests List | `/projects/[id]/contracts` | Complete |
| Screen 15 | Contract Run Detail | `/projects/[id]/contracts/runs/[runId]` | Complete |
| Screen 16 | Contract Schedules | `/projects/[id]/contracts/schedules` | Complete |
| Screen 17 | CI Integration | `/projects/[id]/ci` | Complete |
| Screen 18 | Team & Roles | `/workspace/team` | Complete |
| Screen 19 | API Keys | `/workspace/keys` | Complete |
| Screen 20 | Workspace Settings | `/workspace/settings` | Complete |
| Screen 21 | Billing & Plans | `/workspace/billing` | Complete |
| Screen 22 | Account Settings | `/account` | Complete |
| Screen 23 | Status & Error States | `/_not-found`, `/status` | Complete |
| Screen 24 | Design System Board | `/design-system` | Complete |
