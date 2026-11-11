#!/usr/bin/env node

/**
 * scripts/update-root-changelog.mjs
 *
 * Aggregates package-level CHANGELOG.md updates into the root CHANGELOG.md
 * after "changeset version" runs.
 */

import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const rootChangelogPath = path.join(rootDir, "CHANGELOG.md");
const webPkgPath = path.join(rootDir, "apps/web/package.json");

if (!fs.existsSync(webPkgPath)) {
  process.exit(0);
}

const webPkg = JSON.parse(fs.readFileSync(webPkgPath, "utf8"));
const version = webPkg.version;
const today = new Date().toISOString().split("T")[0];

const packagesToCheck = [
  { name: "@mocklab/web", path: path.join(rootDir, "apps/web/CHANGELOG.md") },
  { name: "@mocklab/api", path: path.join(rootDir, "apps/api/CHANGELOG.md") },
  { name: "@mocklab/shared", path: path.join(rootDir, "packages/shared/CHANGELOG.md") },
];

const newSections = [];

for (const pkg of packagesToCheck) {
  if (!fs.existsSync(pkg.path)) continue;
  const content = fs.readFileSync(pkg.path, "utf8");

  // Extract the latest version block
  // Format: ## X.Y.Z\n\n### Type Changes\n\n- item
  const regex = new RegExp(`## ${version}[\\s\\S]*?(?=\\n## |$)`, "g");
  const match = content.match(regex);
  if (match && match[0]) {
    const body = match[0].replace(`## ${version}`, "").trim();
    if (body) {
      newSections.push(`### ${pkg.name}\n\n${body}`);
    }
  }
}

if (newSections.length === 0) {
  console.log("No new package changelog entries to aggregate into root CHANGELOG.md.");
  process.exit(0);
}

let rootChangelog = fs.existsSync(rootChangelogPath)
  ? fs.readFileSync(rootChangelogPath, "utf8")
  : "# Changelog\n\nAll notable changes to MockLab will be documented in this file.\n\n";

const headerMarker = "All notable changes to MockLab will be documented in this file.\n\n";
const entryHeader = `## [Release ${version}] - (${today})\n\n`;
const entryBody = newSections.join("\n\n") + "\n\n";

// Avoid duplicate entries for the same version
if (rootChangelog.includes(`## [Release ${version}]`)) {
  console.log(`Root CHANGELOG.md already contains [Release ${version}]. Skipping.`);
  process.exit(0);
}

if (rootChangelog.includes(headerMarker)) {
  rootChangelog = rootChangelog.replace(
    headerMarker,
    headerMarker + entryHeader + entryBody
  );
} else {
  rootChangelog = entryHeader + entryBody + rootChangelog;
}

fs.writeFileSync(rootChangelogPath, rootChangelog, "utf8");
console.log(`Updated root CHANGELOG.md with Release ${version} entries.`);
