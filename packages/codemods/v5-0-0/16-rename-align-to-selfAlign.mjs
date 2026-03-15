#!/usr/bin/env node
// Migration: Rename `layout.align` → `layout.selfAlign` for block self-alignment
// Category: B (semi-automated — requires user review)
// Affects: `align:` keys under `layout:` blocks that represent block self-alignment
//
// IMPORTANT: Run AFTER script 03 (content* prefix removal). After script 03,
// any `contentAlign` has already been renamed to `align`. This script targets
// `align:` keys that existed BEFORE the content* rename — i.e., the old
// `layout.align` for self-alignment in the parent row.
//
// Heuristic: finds `align:` as a YAML key that appears to be under a `layout:`
// parent (indented one level deeper). This is a YAML-structural heuristic and
// may produce false positives (e.g., `align:` in area config). User review required.
//
// Usage:
//   node scripts/04-rename-align-to-selfAlign.mjs [--apply] [directory]
//
// Without --apply, runs in dry-run mode (reports matches for review).
// With --apply, creates backups in .codemod-backup/ and applies changes.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';

function findYamlFiles(dir) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(full);
      } else if (entry.isFile() && /\.ya?ml$/.test(entry.name)) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

// Find `align:` keys that appear under `layout:` context.
// Strategy: scan lines, track when we're inside a `layout:` block (based on indentation),
// and flag `align:` keys at the expected child indentation.
function findLayoutAlignKeys(content) {
  const lines = content.split('\n');
  const matches = [];
  let layoutIndent = -1; // indent level of the `layout:` key, -1 = not in layout block

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - trimmed.length;

    // Check if this line starts a `layout:` block
    if (/^layout:/.test(trimmed)) {
      layoutIndent = indent;
      continue;
    }

    // If we're tracking a layout block, check if we've exited it
    if (layoutIndent >= 0) {
      if (indent <= layoutIndent && trimmed !== '') {
        // We've left the layout block (same or less indentation)
        layoutIndent = -1;
      }
    }

    // If inside a layout block, look for `align:` at child indentation
    if (layoutIndent >= 0 && indent > layoutIndent) {
      if (/^align:\s/.test(trimmed) || /^align:$/.test(trimmed)) {
        matches.push({ line: i + 1, text: line.trimEnd(), indent });
      }
    }
  }

  return matches;
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const targetDir = args.find(a => a !== '--apply') || '.';

console.log('=== Migration: Rename layout.align → layout.selfAlign ===');
console.log(`Target: ${targetDir}`);
console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

const files = findYamlFiles(targetDir);
const affected = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const matches = findLayoutAlignKeys(content);
  if (matches.length > 0) {
    affected.push({ file, content, matches });
  }
}

if (affected.length === 0) {
  console.log('No files contain `align:` under `layout:` blocks. Nothing to do.');
  process.exit(0);
}

console.log(`Found ${affected.length} file(s) with layout.align candidates:\n`);

for (const { file, matches } of affected) {
  const rel = relative(targetDir, file);
  console.log(`  ${rel}: ${matches.length} match(es)`);
  for (const m of matches) {
    console.log(`    L${m.line}: ${m.text}`);
  }
  console.log();
}

const totalMatches = affected.reduce((sum, { matches }) => sum + matches.length, 0);
console.log(`Total: ${totalMatches} candidate(s) across ${affected.length} file(s)\n`);

console.log('REVIEW NEEDED:');
console.log('  - Confirm each `align:` is for block self-alignment (should become `selfAlign:`)');
console.log('  - If `align:` is in an area/slot config (not layout), it should stay as `align:`');
console.log('  - After script 03, old `contentAlign` has been renamed to `align` — those are');
console.log('    content area alignment and should NOT be renamed to `selfAlign`');
console.log();

if (apply) {
  const backupDir = join(targetDir, '.codemod-backup');
  mkdirSync(backupDir, { recursive: true });
  for (const { file } of affected) {
    const rel = relative(targetDir, file);
    const backupPath = join(backupDir, rel);
    mkdirSync(dirname(backupPath), { recursive: true });
    copyFileSync(file, backupPath);
  }
  console.log(`Backups saved to ${relative('.', backupDir) || '.codemod-backup'}/`);

  let changeCount = 0;
  for (const { file, content, matches } of affected) {
    const lines = content.split('\n');
    // Replace only the specific lines identified as layout.align candidates
    for (const m of matches) {
      const lineIdx = m.line - 1;
      lines[lineIdx] = lines[lineIdx].replace(/^(\s*)align:/, '$1selfAlign:');
    }
    const updated = lines.join('\n');

    if (updated !== content) {
      writeFileSync(file, updated, 'utf8');
      changeCount++;
    }
  }
  console.log(`\nChanges applied to ${changeCount} file(s).`);
  console.log('Review changes with `git diff` and test your app.');
} else {
  console.log('Run with --apply to make changes.');
}
