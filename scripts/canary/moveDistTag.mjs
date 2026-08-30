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

/*
  Move an npm dist-tag to one version for every publishable workspace package.

  Usage:
    node scripts/canary/moveDistTag.mjs --version 0.0.0-experimental-20260901020115 --tag known-good
    node scripts/canary/moveDistTag.mjs --version 1.2.3 --tag known-good --dry-run

  Discovers packages from the globs in pnpm-workspace.yaml (the way
  scripts/release-notes.mjs does), skips private packages and lowdefy-vscode, and
  runs `npm dist-tag add <name>@<version> <tag>` for each. Reports every failure
  and exits non-zero if any failed.

  Authentication: OIDC trusted publishing covers `npm publish` only. Moving a
  dist-tag needs a granular write token in NODE_AUTH_TOKEN (the NPM_TOKEN secret
  in the publish environment). Zero external dependencies.
*/

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const EXCLUDED_PACKAGE_NAMES = new Set(['lowdefy-vscode']);

function fail(message) {
  console.error(`moveDistTag: ${message}`);
  process.exit(1);
}

function parseOptions() {
  const { values } = parseArgs({
    options: {
      version: { type: 'string' },
      tag: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  if (!values.version) {
    fail('--version is required.');
  }
  if (!values.tag) {
    fail('--tag is required.');
  }
  return { version: values.version, tag: values.tag, dryRun: values['dry-run'] };
}

function readWorkspacePatterns() {
  const content = readFileSync(path.join(REPO_ROOT, 'pnpm-workspace.yaml'), 'utf8');
  const patterns = [];
  let inPackages = false;
  for (const line of content.split('\n')) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages && /^\S/.test(line)) {
      break;
    }
    const match = line.match(/^\s*-\s*['"]?([^'"#\n]+?)['"]?\s*$/);
    if (inPackages && match !== null) {
      patterns.push(match[1].trim());
    }
  }
  return patterns;
}

function listDirectories(directory) {
  if (!existsSync(directory)) {
    return [];
  }
  return readdirSync(directory)
    .map((name) => path.join(directory, name))
    .filter((entry) => statSync(entry).isDirectory());
}

// `a/*` matches direct children, `a/**` matches children and grandchildren -
// the two shapes pnpm-workspace.yaml uses here.
function resolvePattern(pattern) {
  const base = path.join(REPO_ROOT, pattern.replace(/\/?\*\*?$/, ''));
  const children = listDirectories(base);
  if (!pattern.endsWith('**')) {
    return children;
  }
  return children.flatMap((child) => [child, ...listDirectories(child)]);
}

function collectPublishablePackages() {
  const packages = new Map();
  readWorkspacePatterns()
    .flatMap(resolvePattern)
    .forEach((directory) => {
      const packageJsonPath = path.join(directory, 'package.json');
      if (!existsSync(packageJsonPath)) {
        return;
      }
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.private === true || EXCLUDED_PACKAGE_NAMES.has(packageJson.name)) {
        return;
      }
      packages.set(packageJson.name, path.relative(REPO_ROOT, directory));
    });
  return [...packages.keys()].sort();
}

function moveTag({ name, version, tag }) {
  const result = spawnSync('npm', ['dist-tag', 'add', `${name}@${version}`, tag], {
    encoding: 'utf8',
  });
  if (result.status === 0) {
    return null;
  }
  return `${result.stderr ?? ''}${result.stdout ?? ''}`.trim() || `exit code ${result.status}`;
}

const { version, tag, dryRun } = parseOptions();
const packages = collectPublishablePackages();
if (packages.length === 0) {
  fail('No publishable packages found.');
}

console.log(`${dryRun ? 'Would move' : 'Moving'} dist-tag "${tag}" to ${version} for ${packages.length} packages.`);
const failures = [];
packages.forEach((name) => {
  if (dryRun) {
    console.log(`  npm dist-tag add ${name}@${version} ${tag}`);
    return;
  }
  const error = moveTag({ name, version, tag });
  if (error === null) {
    console.log(`  ok    ${name}@${version} -> ${tag}`);
    return;
  }
  failures.push({ name, error });
  console.error(`  FAIL  ${name}@${version} -> ${tag}: ${error}`);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} of ${packages.length} dist-tag moves failed.`);
  process.exit(1);
}
if (!dryRun) {
  console.log(`\nMoved "${tag}" to ${version} for all ${packages.length} packages.`);
}
