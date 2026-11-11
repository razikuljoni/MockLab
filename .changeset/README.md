# Changesets in MockLab

This repository uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs across all monorepo packages (`@mocklab/shared`, `@mocklab/web`, `@mocklab/api`).

## Adding a Changeset

When you submit a PR with code changes, run:

```bash
pnpm changeset
```

Follow the prompts to select which packages changed and whether the change is `major`, `minor`, or `patch`. Commit the generated markdown file to your branch.

Alternatively, use the automatic changeset generator:

```bash
pnpm changeset:auto
```

## Release Flow

1. When PRs are merged to `main`, the `release.yml` GitHub Action detects changesets and automatically maintains a **"Version Packages"** pull request.
2. The release PR contains bumped versions across all `package.json` files and updated `CHANGELOG.md` files.
3. Merging the release PR automatically tags the release and creates a GitHub Release.
