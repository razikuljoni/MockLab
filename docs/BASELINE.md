# MockLab Phase 0 Baseline & Setup Record

**Date:** 2026-11-20  
**Git HEAD:** `0c28db4` (`chore(release): version packages (#15)`, 2026-11-11)  
**Branch:** `fix_report_issues`  
**Repository:** `github.com/razikuljoni/MockLab`  

## 1. Baseline Command Suite Execution

- `pnpm install`: PASSED (pnpm v10.34.5, 574 packages resolved)
- `pnpm --filter @mocklab/shared build`: PASSED (`tsc` compiled cleanly)
- `pnpm --filter @mocklab/api exec prisma generate`: PASSED (Prisma Client v6.19.3 generated for darwin-arm64)
- `pnpm lint`: PASSED (ESLint v10.14.0 exit code 0)
- `pnpm typecheck`: PASSED (TypeScript v5.9.3 exit code 0 across monorepo)
- `pnpm test`: PASSED (Vitest: 14 test files passed, 51 tests passed)
- `pnpm test:e2e`: PASSED against deployed demo `mocklab-theta.vercel.app` (5 passed; testing client-side stubs)

## 2. CI & PR Status

- Latest CI runs on `main`:
  - Run 43884803536 (`Security Analysis`): SUCCESS
  - Run 43038197174 (`CI` on `main` commit `0c28db4`): SUCCESS
  - Run 43804383707 (`CI` on Dependabot PR #18): FAILED (failing dependency update)
- Open PRs:
  - #18: `chore(deps): bump the dependencies group across 1 directory with 16 updates`
  - #17: `chore(deps): bump github/codeql-action from 3.28.10 to 3.28.11`
  - #16: `chore(deps): bump actions/setup-node from 4.2.0 to 4.3.0`

## 3. Owner Decisions (Recommended Defaults Applied)

1. **Mock URL shape:** Keep `/m/:slug` path prefix on API domain (no domain purchase required).
2. **Redis provider:** Upstash free tier (TCP) / Managed Redis; spike recorded in README.
3. **Mock auth default:** Projects private-by-default.
4. **Pricing:** Kept TBD on all surfaces; removing all $19 / $29 / $79 / $99 claims in Phase 7.
5. **Stripe:** Out of scope until usage counting is real; honest "coming soon" preserved.
6. **Email provider:** Resend free tier if configured; otherwise log-only without claiming sent.
7. **API service name on Render:** `mocklab-api-prod` (since `mocklab-api.onrender.com` is taken by unrelated Django app).
