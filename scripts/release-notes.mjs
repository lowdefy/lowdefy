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
// 5. Get date for a version from git tags
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
// 6. Generate developer-facing notes via Claude CLI
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
// 7. Parse individual changeset entries from changelog content
// ---------------------------------------------------------------------------

/**
 * Parses changelog content into individual changeset entries.
 * Each entry starts with `- {hash}: ` and continues until the next entry or heading.
 * Returns array of { hash, firstLine, body, section } objects.
 */
function parseChangesetEntries(content) {
  const entries = [];
  let currentSection = null;
  let currentEntry = null;

  for (const line of content.split('\n')) {
    // Track section headings (### Minor Changes, ### Patch Changes)
    const sectionMatch = line.match(/^### (Minor Changes|Patch Changes|Major Changes)/);
    if (sectionMatch) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = null;
      currentSection = sectionMatch[1];
      continue;
    }

    // Skip dependency update lines
    if (line.match(/^- Updated dependencies/)) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = null;
      continue;
    }
    // Skip package@version lines (dependency list items)
    if (line.match(/^\s+- @?[\w/-]+@\d+\.\d+\.\d+$/)) continue;

    // New changeset entry: `- {hash}: {description}`
    const entryMatch = line.match(/^- ([a-f0-9]{8,}): (.+)/);
    if (entryMatch) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = {
        hash: entryMatch[1],
        firstLine: entryMatch[2],
        bodyLines: [],
        section: currentSection,
      };
      continue;
    }

    // Continuation of current entry (indented or blank lines within an entry)
    if (currentEntry) {
      currentEntry.bodyLines.push(line);
    }
  }
  if (currentEntry) entries.push(currentEntry);

  // Trim trailing blank lines from each entry body
  for (const entry of entries) {
    while (entry.bodyLines.length > 0 && entry.bodyLines[entry.bodyLines.length - 1].trim() === '') {
      entry.bodyLines.pop();
    }
    entry.body = entry.bodyLines.join('\n');
    delete entry.bodyLines;
  }

  return entries;
}

// ---------------------------------------------------------------------------
// 8. Build markdown for a version (deduplicated by changeset hash)
// ---------------------------------------------------------------------------

function buildVersionMarkdown(entry) {
  const lines = [];

  // Collect all changeset entries across packages, deduplicated by hash
  const changesetMap = new Map(); // hash -> { firstLine, body, section, packages[] }
  // Track entries without hashes (plain text changes)
  const plainEntries = []; // { text, packageName }

  for (const pkg of entry.packages) {
    const entries = parseChangesetEntries(pkg.content);

    if (entries.length === 0) {
      // Package has content but no parseable entries — include as plain text
      const stripped = stripDependencyLines(pkg.content);
      if (stripped.trim()) {
        plainEntries.push({ text: stripped, packageName: pkg.name });
      }
      continue;
    }

    for (const e of entries) {
      if (changesetMap.has(e.hash)) {
        changesetMap.get(e.hash).packages.push(pkg.name);
      } else {
        changesetMap.set(e.hash, {
          firstLine: e.firstLine,
          body: e.body,
          section: e.section,
          packages: [pkg.name],
        });
      }
    }
  }

  // Build deduplicated technical content for Claude
  const technicalParts = [];
  for (const [hash, cs] of changesetMap) {
    const pkgList = cs.packages.join(', ');
    technicalParts.push(`- ${hash}: ${cs.firstLine}\n  Packages: ${pkgList}\n${cs.body}`);
  }
  for (const pe of plainEntries) {
    technicalParts.push(`- ${pe.packageName}: ${pe.text}`);
  }
  const technicalContent = technicalParts.join('\n\n');

  // AI-generated highlights
  const highlights = generateNotes(technicalContent);
  if (highlights) {
    lines.push('## Highlights');
    lines.push('');
    lines.push(highlights);
    lines.push('');
  }

  // Group changesets by section type
  const minorChanges = [];
  const patchChanges = [];

  for (const [, cs] of changesetMap) {
    const target = cs.section === 'Minor Changes' || cs.section === 'Major Changes'
      ? minorChanges
      : patchChanges;
    target.push(cs);
  }

  if (minorChanges.length > 0) {
    lines.push('## What\'s New');
    lines.push('');
    for (const cs of minorChanges) {
      const pkgList = cs.packages.map((p) => `\`${p}\``).join(', ');
      lines.push(`### ${cs.firstLine}`);
      lines.push('');
      lines.push(`Packages: ${pkgList}`);
      lines.push('');
      if (cs.body.trim()) {
        lines.push(cs.body);
        lines.push('');
      }
    }
  }

  if (patchChanges.length > 0) {
    lines.push('## Fixes & Improvements');
    lines.push('');
    for (const cs of patchChanges) {
      const pkgList = cs.packages.map((p) => `\`${p}\``).join(', ');
      lines.push(`- **${cs.firstLine}** (${pkgList})`);
      if (cs.body.trim()) {
        lines.push('');
        lines.push(cs.body);
        lines.push('');
      }
    }
  }

  if (plainEntries.length > 0) {
    for (const pe of plainEntries) {
      lines.push(`- **${pe.packageName}**: ${pe.text}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

/**
 * Strips "Updated dependencies" blocks and package@version lines from content.
 */
function stripDependencyLines(content) {
  return content
    .split('\n')
    .filter((line) => {
      if (line.match(/^- Updated dependencies/)) return false;
      if (line.match(/^\s+- @?[\w/-]+@\d+\.\d+\.\d+$/)) return false;
      return true;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// 8. Main
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
    const markdown = buildVersionMarkdown(entry);
    allSections.push({ version: entry.version, date, markdown });
  }

  // Write output
  const output = allSections
    .map((s) => s.markdown)
    .join('\n\n---\n\n');

  writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`\nWrote release notes to ${OUTPUT_FILE}`);

  console.log('Done!');
}

main();
