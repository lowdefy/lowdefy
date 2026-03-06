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
 * Release Notes Generator for Lowdefy
 *
 * Collects per-package CHANGELOGs, merges them by the primary app version,
 * and generates developer-facing release notes via Claude CLI.
 *
 * Usage:
 *   node scripts/release-notes.mjs                    # generate notes for latest version
 *   node scripts/release-notes.mjs --all              # backfill all versions
 *   node scripts/release-notes.mjs --output-file=path # write markdown to a file
 *
 * Zero external dependencies — uses only Node.js built-ins.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const flags = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--output-file')));
const FLAG_ALL = flags.has('--all');
const outputFileArg = process.argv.find((a) => a.startsWith('--output-file='));
const OUTPUT_FILE = outputFileArg ? outputFileArg.split('=')[1] : '/tmp/release-notes.md';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readOr(path, fallback = '') {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// 1. Discover CHANGELOG.md files from pnpm-workspace.yaml
// ---------------------------------------------------------------------------

function discoverChangelogs() {
  const wsPath = join(ROOT, 'pnpm-workspace.yaml');
  const wsContent = readOr(wsPath);
  if (!wsContent) {
    console.error('Could not read pnpm-workspace.yaml');
    process.exit(1);
  }

  const patterns = [];
  for (const line of wsContent.split('\n')) {
    const m = line.match(/^\s*-\s*['"]?([^'"#\n]+?)['"]?\s*$/);
    if (m && m[1].trim()) patterns.push(m[1].trim());
  }

  const changelogs = [];

  for (const pattern of patterns) {
    const base = pattern.replace(/\/?\*\*?$/, '');
    const baseDir = base ? join(ROOT, base) : ROOT;

    if (!existsSync(baseDir) || !statSync(baseDir).isDirectory()) continue;

    const isGlob = pattern.endsWith('/*') || pattern.endsWith('/**') || pattern === '*';
    if (isGlob) {
      const scanDir = (dir) => {
        for (const entry of readdirSync(dir)) {
          if (entry === 'node_modules' || entry.startsWith('.')) continue;
          const full = join(dir, entry);
          if (!statSync(full).isDirectory()) continue;
          const cl = join(full, 'CHANGELOG.md');
          const pkg = join(full, 'package.json');
          if (existsSync(cl) && existsSync(pkg)) {
            const pkgJson = JSON.parse(readFileSync(pkg, 'utf-8'));
            changelogs.push({ path: cl, name: pkgJson.name, dir: full });
          }
          // Recurse for ** patterns
          if (pattern.endsWith('/**')) {
            scanDir(full);
          }
        }
      };
      scanDir(baseDir);
    } else {
      const cl = join(baseDir, 'CHANGELOG.md');
      const pkg = join(baseDir, 'package.json');
      if (existsSync(cl) && existsSync(pkg)) {
        const pkgJson = JSON.parse(readFileSync(pkg, 'utf-8'));
        changelogs.push({ path: cl, name: pkgJson.name, dir: baseDir });
      }
    }
  }

  return changelogs;
}

// ---------------------------------------------------------------------------
// 2. Parse per-package changelogs
// ---------------------------------------------------------------------------

function parseChangelog(filePath) {
  const text = readOr(filePath);
  const sections = [];
  let current = null;

  for (const line of text.split('\n')) {
    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)\s*$/);
    if (versionMatch) {
      if (current) sections.push(current);
      current = { version: versionMatch[1], lines: [] };
      continue;
    }
    if (line.startsWith('All notable changes to this project')) {
      if (current) sections.push(current);
      break;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);

  return sections.map((s) => {
    while (s.lines.length > 0 && s.lines[s.lines.length - 1].trim() === '') {
      s.lines.pop();
    }
    while (s.lines.length > 0 && s.lines[0].trim() === '') {
      s.lines.shift();
    }
    return { version: s.version, content: s.lines.join('\n') };
  });
}

// ---------------------------------------------------------------------------
// 3. Filter out dependency-only changelog entries
// ---------------------------------------------------------------------------

/**
 * Returns true if the changelog content has real changes beyond just
 * "Updated dependencies" and package version bumps.
 */
function hasRealChanges(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  for (const line of lines) {
    const trimmed = line.replace(/^[\s-]*/, '');
    // Skip headings like "### Patch Changes", "### Minor Changes"
    if (trimmed.startsWith('### ')) continue;
    // Skip "Updated dependencies [hash]"
    if (trimmed.startsWith('Updated dependencies')) continue;
    // Skip lines that are just "@lowdefy/package@version"
    if (trimmed.match(/^@?[\w/-]+@\d+\.\d+\.\d+$/)) continue;
    // Anything else is a real change
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// 4. Merge changes grouped by primary version
// ---------------------------------------------------------------------------

function mergeByPrimaryVersion(changelogs, processAll) {
  // The 'lowdefy' CLI package is the primary — all fixed packages share its version.
  const primary = changelogs.find((c) => c.name === 'lowdefy');
  if (!primary) {
    console.error('Could not find lowdefy CLI changelog');
    process.exit(1);
  }

  const primarySections = parseChangelog(primary.path);
  const primaryVersions = primarySections.map((s) => s.version);

  const allParsed = changelogs.map((c) => ({
    name: c.name,
    sections: parseChangelog(c.path),
  }));

  const merged = [];
  const versionsToProcess = processAll ? primaryVersions : primaryVersions.slice(0, 1);

  for (const version of versionsToProcess) {
    const packageSections = [];

    for (const pkg of allParsed) {
      const section = pkg.sections.find((s) => s.version === version);
      if (section && section.content.trim() && hasRealChanges(section.content)) {
        packageSections.push({
          name: pkg.name,
          version: section.version,
          content: section.content,
        });
      }
    }

    if (packageSections.length === 0) continue;
    merged.push({ version, packages: packageSections });
  }

  return merged;
}

// ---------------------------------------------------------------------------
// 4. Get date for a version from git tags
// ---------------------------------------------------------------------------

function getVersionDate(version) {
  const tag = `v${version}`;
  try {
    const date = execSync(`git log -1 --format=%ai "${tag}" 2>/dev/null`, {
      encoding: 'utf-8',
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (date) {
      return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // tag not found
  }
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// 5. Generate developer-facing notes via Claude CLI
// ---------------------------------------------------------------------------

function generateNotes(technicalNotes) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('  Skipping AI notes (no ANTHROPIC_API_KEY)');
    return null;
  }

  const prompt =
    'You are writing release notes for Lowdefy, an open-source config-driven web framework built on Next.js. ' +
    'Convert these technical changelog entries into clear, developer-friendly bullet points. ' +
    'Group related changes together. Focus on what changed and why it matters to developers using Lowdefy. ' +
    'Skip internal dependency bumps and version-only changes. ' +
    'Return only markdown bullet points, no headings or preamble. ' +
    'If there are no meaningful changes, return "- Minor internal improvements and dependency updates."';

  try {
    const result = execSync(`claude -p --model claude-haiku-4-5-20251001 "${prompt}"`, {
      input: technicalNotes,
      encoding: 'utf-8',
      cwd: ROOT,
      timeout: 60000,
      maxBuffer: 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch (err) {
    console.warn('  Claude CLI failed, skipping AI notes:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 6. Build markdown for a version
// ---------------------------------------------------------------------------

function buildVersionMarkdown(entry, date) {
  const lines = [];

  // Collect technical content for Claude
  const technicalContent = entry.packages
    .map((p) => `### ${p.name}\n${p.content}`)
    .join('\n\n');

  // AI-generated highlights
  const highlights = generateNotes(technicalContent);
  if (highlights) {
    lines.push('## Highlights');
    lines.push('');
    lines.push(highlights);
    lines.push('');
  }

  // Technical changes grouped by category
  const categories = categorizePackages(entry.packages);

  for (const [category, packages] of Object.entries(categories)) {
    if (packages.length === 0) continue;
    lines.push(`## ${category}`);
    lines.push('');
    for (const pkg of packages) {
      lines.push(`### ${pkg.name}`);
      lines.push('');
      lines.push(pkg.content);
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd();
}

function categorizePackages(packages) {
  const categories = {
    Core: [],
    Plugins: [],
    Servers: [],
    Utilities: [],
  };

  for (const pkg of packages) {
    const name = pkg.name;
    if (
      name === 'lowdefy' ||
      name.match(/@lowdefy\/(api|build|cli|client|engine|operators|layout)/)
    ) {
      categories['Core'].push(pkg);
    } else if (
      name.match(/@lowdefy\/(actions-|blocks-|connection-|operators-)/)
    ) {
      categories['Plugins'].push(pkg);
    } else if (name.match(/@lowdefy\/server/)) {
      categories['Servers'].push(pkg);
    } else {
      categories['Utilities'].push(pkg);
    }
  }

  return categories;
}

// ---------------------------------------------------------------------------
// 7. Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Release Notes Generator\n');

  console.log('Discovering package changelogs...');
  const changelogs = discoverChangelogs();
  console.log(`  Found ${changelogs.length} packages`);

  if (changelogs.length === 0) {
    console.log('No changelogs found. Exiting.');
    process.exit(0);
  }

  const merged = mergeByPrimaryVersion(changelogs, FLAG_ALL);
  console.log(`  Versions to process: ${merged.length}`);

  if (merged.length === 0) {
    console.log('No versions to process.');
    process.exit(0);
  }

  console.log('\nGenerating release notes...');
  const allSections = [];

  for (const entry of merged) {
    const date = getVersionDate(entry.version);
    console.log(`  Processing v${entry.version} (${date})...`);
    const markdown = buildVersionMarkdown(entry, date);
    allSections.push({ version: entry.version, date, markdown });
  }

  // Write output
  const output = allSections
    .map((s) => s.markdown)
    .join('\n\n---\n\n');

  writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`\nWrote release notes to ${OUTPUT_FILE}`);

  // Also print the version for use by the workflow
  if (allSections.length > 0) {
    console.log(`::set-output name=version::v${allSections[0].version}`);
  }

  console.log('Done!');
}

main();
