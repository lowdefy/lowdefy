#!/usr/bin/env node

/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/**
 * Idempotent release gate.
 *
 * Asserts that every publishable workspace package is live on npm at the
 * version in its local package.json. This is the source of truth for whether a
 * release succeeded — not the exit code of `changeset publish`, which treats an
 * already-published version as an error and so cannot tell "already done" apart
 * from "genuinely failed".
 *
 * - All packages present at their local version -> exit 0 (release complete,
 *   even on a rerun where publish re-attempted and rejected existing versions).
 * - Any package missing its version -> exit 1 (a real failure: a missing trusted
 *   publisher, a network error, etc. — rerun after fixing to recover).
 *
 * The publishable set mirrors what `changeset publish` targets: every non-private
 * workspace package, minus the `ignore` list in .changeset/config.json.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RETRIES = 5;
const RETRY_DELAY_MS = 5000;
const CONCURRENCY = 10;
const REGISTRY = (process.env.npm_config_registry ?? 'https://registry.npmjs.org').replace(/\/$/, '');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function getPublishablePackages() {
  const { ignore = [] } = readJson('.changeset/config.json');
  const ignored = new Set(ignore);

  const workspaces = JSON.parse(
    execFileSync('pnpm', ['ls', '-r', '--depth', '-1', '--json'], { encoding: 'utf8' })
  );

  return workspaces
    .map((workspace) => readJson(join(workspace.path, 'package.json')))
    .filter((pkg) => pkg.name && pkg.version && pkg.private !== true && !ignored.has(pkg.name))
    .map((pkg) => ({ name: pkg.name, version: pkg.version }));
}

async function isPublished({ name, version }) {
  // The version manifest endpoint is a single lightweight request: 200 = live, 404 = not there.
  try {
    const response = await fetch(`${REGISTRY}/${name}/${version}`, { cache: 'no-store' });
    return response.status === 200;
  } catch {
    // Network/registry error — treat as not-yet-confirmed and let the retry loop reassess.
    return false;
  }
}

async function findMissing(packages) {
  const remaining = [...packages];
  const missing = [];
  async function worker() {
    let pkg;
    while ((pkg = remaining.pop())) {
      if (!(await isPublished(pkg))) missing.push(pkg);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return missing;
}

const packages = getPublishablePackages();
let missing = packages;

for (let attempt = 1; attempt <= RETRIES && missing.length > 0; attempt += 1) {
  missing = await findMissing(missing);
  if (missing.length > 0 && attempt < RETRIES) {
    // Freshly published versions can lag in the registry — wait and re-check.
    console.log(
      `Waiting for ${missing.length} package(s) to appear on npm (attempt ${attempt}/${RETRIES})...`
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
}

if (missing.length > 0) {
  console.error('The following packages are not published at their release version:');
  missing.forEach((pkg) => console.error(`  ${pkg.name}@${pkg.version}`));
  console.error('\nRelease is incomplete. Fix the cause and re-run the release to recover.');
  process.exit(1);
}

console.log(`All ${packages.length} publishable packages are live on npm at their release version.`);
