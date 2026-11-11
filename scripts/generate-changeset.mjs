#!/usr/bin/env node

/**
 * scripts/generate-changeset.mjs
 *
 * Automatically inspects git commits on the current branch compared to main,
 * determines semantic bump level (major/minor/patch) and affected packages,
 * and outputs a valid Changeset markdown file.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const baseRef = process.env.BASE_REF || "origin/main";
let logOutput = run(`git log ${baseRef}..HEAD --oneline`);

if (!logOutput) {
  // If comparison fails or on main, inspect latest commit
  logOutput = run("git log -1 --oneline");
}

if (!logOutput) {
  console.log("No commits found to generate changeset from.");
  process.exit(0);
}

const lines = logOutput.split("\n").filter(Boolean);
let bumpType = "patch"; // default
const messages = [];

for (const line of lines) {
  const commitMsg = line.replace(/^[a-f0-9]+\s+/, "").trim();
  messages.push(commitMsg);

  if (/BREAKING|!:/i.test(commitMsg)) {
    bumpType = "major";
  } else if (/^feat(\(.*\))?:/i.test(commitMsg) && bumpType !== "major") {
    bumpType = "minor";
  }
}

// Check which packages were modified
const changedFiles = run(`git diff --name-only ${baseRef}...HEAD`) || run("git diff --name-only HEAD~1");
const fileList = changedFiles.split("\n").filter(Boolean);

const packages = new Set();
for (const file of fileList) {
  if (file.startsWith("apps/web/")) packages.add("@mocklab/web");
  if (file.startsWith("apps/api/")) packages.add("@mocklab/api");
  if (file.startsWith("packages/shared/")) packages.add("@mocklab/shared");
}

// Fallback to all linked packages if root files or no package files changed
if (packages.size === 0) {
  packages.add("@mocklab/shared");
  packages.add("@mocklab/api");
  packages.add("@mocklab/web");
}

const changesetDir = path.resolve(process.cwd(), ".changeset");
if (!fs.existsSync(changesetDir)) {
  fs.mkdirSync(changesetDir, { recursive: true });
}

// Check if a non-readme changeset already exists
const existingChangesets = fs.readdirSync(changesetDir).filter(f => f.endsWith(".md") && f !== "README.md");
if (existingChangesets.length > 0 && !process.env.FORCE) {
  console.log(`Changeset already exists: ${existingChangesets.join(", ")}. Skipping automatic creation.`);
  process.exit(0);
}

const uniqueId = crypto.randomBytes(4).toString("hex");
const filename = path.join(changesetDir, `auto-${uniqueId}.md`);

const packageFrontmatter = Array.from(packages)
  .map(pkg => `"${pkg}": ${bumpType}`)
  .join("\n");

const summaryText = messages.slice(0, 5).map(m => `- ${m}`).join("\n");

const content = `---
${packageFrontmatter}
---

${summaryText || "Automated update."}
`;

fs.writeFileSync(filename, content, "utf8");
console.log(`Created automated changeset: .changeset/auto-${uniqueId}.md (${bumpType})`);
