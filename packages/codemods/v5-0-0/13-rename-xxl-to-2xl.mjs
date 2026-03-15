#!/usr/bin/env node
// Migration: Rename `xxl` breakpoint key/value to `2xl` in Lowdefy YAML configs
// Category: B (semi-automated — broad rename with review)
// Affects: layout.xxl, slots.*.gutter.xxl, _switch/_select case keys, _media string comparisons
//
// Usage:
//   node scripts/01-rename-xxl-to-2xl.mjs [--apply] [directory]
//
// Without --apply, runs in dry-run mode (reports changes without modifying files).
// With --apply, creates backups in .codemod-backup/ and applies changes.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
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

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const targetDir = args.find(a => a !== '--apply') || '.';

console.log('=== Migration: Rename xxl → 2xl ===');
console.log(`Target: ${targetDir}`);
console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

const files = findYamlFiles(targetDir);

// Pattern 1: `xxl:` as a YAML key (with optional leading whitespace)
// Matches: "  xxl:", "xxl:", "    xxl: { span: 4 }"
// Anchored to start-of-line (after whitespace) to avoid mid-line false positives.
const KEY_PATTERN = /^(\s*)xxl:/gm;

// Pattern 2: `"xxl"` or `'xxl'` as a string value (e.g., _eq comparison with _media)
const DOUBLE_QUOTE_PATTERN = /"xxl"/g;
const SINGLE_QUOTE_PATTERN = /'xxl'/g;

// Pattern 3: Bare `xxl` as an unquoted YAML string value (e.g., `- xxl` in a list)
// Only match when xxl is a standalone value after `: ` or `- `
const BARE_VALUE_PATTERN = /^(\s*-\s+)xxl$/gm;
const BARE_MAP_VALUE_PATTERN = /^(\s*\S+:\s+)xxl$/gm;

const affected = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const changes = [];

  // Count matches for each pattern
  const keyMatches = (content.match(KEY_PATTERN) || []).length;
  const dblQuoteMatches = (content.match(DOUBLE_QUOTE_PATTERN) || []).length;
  const sglQuoteMatches = (content.match(SINGLE_QUOTE_PATTERN) || []).length;
  const bareValueMatches = (content.match(BARE_VALUE_PATTERN) || []).length;
  const bareMapValueMatches = (content.match(BARE_MAP_VALUE_PATTERN) || []).length;

  if (keyMatches > 0) changes.push(`${keyMatches} key(s) xxl:`);
  if (dblQuoteMatches > 0) changes.push(`${dblQuoteMatches} string(s) "xxl"`);
  if (sglQuoteMatches > 0) changes.push(`${sglQuoteMatches} string(s) 'xxl'`);
  if (bareValueMatches > 0) changes.push(`${bareValueMatches} bare value(s) - xxl`);
  if (bareMapValueMatches > 0) changes.push(`${bareMapValueMatches} bare map value(s) : xxl`);

  if (changes.length > 0) {
    affected.push({ file, content, changes });
  }
}

if (affected.length === 0) {
  console.log('No files contain `xxl` references. Nothing to do.');
  process.exit(0);
}

console.log(`Found ${affected.length} file(s) with xxl references:\n`);

for (const { file, content, changes } of affected) {
  const rel = relative(targetDir, file);
  console.log(`  ${rel}: ${changes.join(', ')}`);

  // Show matching lines for review
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/\bxxl\b/.test(line)) {
      console.log(`    L${i + 1}: ${line.trimEnd()}`);
    }
  });
  console.log();
}

const totalChanges = affected.reduce((sum, { changes }) =>
  sum + changes.reduce((s, c) => s + parseInt(c), 0), 0
);
console.log(`Total: ${totalChanges} replacement(s) across ${affected.length} file(s)\n`);

console.log('REVIEW NEEDED:');
console.log('  - Verify no YAML keys named `xxl` are block IDs or custom properties (not breakpoints)');
console.log('  - Verify string values "xxl" are _media comparisons, not unrelated data');
console.log();

if (apply) {
  // Create backups
  const backupDir = join(targetDir, '.codemod-backup');
  mkdirSync(backupDir, { recursive: true });
  for (const { file } of affected) {
    const rel = relative(targetDir, file);
    const backupPath = join(backupDir, rel);
    mkdirSync(dirname(backupPath), { recursive: true });
    copyFileSync(file, backupPath);
  }
  console.log(`Backups saved to ${relative('.', backupDir) || '.codemod-backup'}/`);

  // Apply changes
  let changeCount = 0;
  for (const { file, content } of affected) {
    let updated = content;
    updated = updated.replace(KEY_PATTERN, '$12xl:');
    updated = updated.replace(DOUBLE_QUOTE_PATTERN, '"2xl"');
    updated = updated.replace(SINGLE_QUOTE_PATTERN, "'2xl'");
    updated = updated.replace(BARE_VALUE_PATTERN, '$12xl');
    updated = updated.replace(BARE_MAP_VALUE_PATTERN, '$12xl');

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
