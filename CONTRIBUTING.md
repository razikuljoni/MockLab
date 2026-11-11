# Contributing to MockLab

Thank you for contributing to MockLab! Follow these standards to submit enhancements and fixes.

---

## Local Development Workflow

### Prerequisites
- Node.js 22+
- pnpm 10+
- Docker & Docker Compose (for local PostgreSQL & Redis)

### Quickstart
```bash
# 1. Clone repository
git clone https://github.com/razikuljoni/MockLab.git
cd MockLab

# 2. Start backing services
docker compose up -d

# 3. Install dependencies
pnpm install

# 4. Run tests
pnpm test

# 5. Start dev servers
pnpm dev
# Web: http://localhost:3000
# API: http://localhost:3001
```

---

## Code Quality Standards

Before committing, ensure all checks pass:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

## Commit & Branch Conventions

We follow Conventional Commits:
- `feat(mock)`: Inbound router additions or new matching features
- `feat(contracts)`: Diff engine or assertion changes
- `fix(scenarios)`: State bucket bug fixes
- `docs(...)`: Documentation improvements
- `test(...)`: Unit/integration test suites

Pull Request titles must follow the format `<type>(<scope>): <summary>` to pass the PR linter.

---

## Adding Changesets

For any feature or bug fix that affects `@mocklab/*` packages, add a changeset before opening your PR:

```bash
# Interactive CLI
pnpm changeset

# Or automatic generator based on your branch commits
pnpm changeset:auto
```

Commit the generated file under `.changeset/`. When your PR merges to `main`, release automation will bump versions and update `CHANGELOG.md` automatically.
