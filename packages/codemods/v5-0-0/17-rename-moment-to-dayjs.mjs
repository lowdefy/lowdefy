#!/usr/bin/env node
// Migration: Rename _moment operator to _dayjs in all YAML config files
// Category: A (Deterministic)
// Affects: All YAML files using _moment as an operator key
//
// Handles these patterns:
//   _moment:           → _dayjs:
//   _moment.format:    → _dayjs.format:
//   _moment.humanizeDuration: → _dayjs.humanizeDuration:
//   - _moment:         → - _dayjs:
//   - _moment.format:  → - _dayjs.format:
//
// Usage:
//   node scripts/01-rename-moment-to-dayjs.mjs [--apply] [directory]
//
// Without --apply, runs in dry-run mode (reports changes without modifying files).
// With --apply, creates backups in .codemod-backup/ and applies changes.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

function findYamlFiles(dir) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) walk(full);
      else if (entry.isFile() && /\.ya?ml$/.test(entry.name)) results.push(full);
    }
  }
  walk(dir);
  return results;
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const targetDir = args.find(a => a !== '--apply') || '.';

console.log('=== Migration: Rename _moment → _dayjs ===');
console.log(`Target: ${targetDir}`);
console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

const files = findYamlFiles(targetDir);

// Match _moment as a YAML key (with or without method suffix)
// Patterns:
//   _moment:             (standalone operator)
//   _moment.format:      (operator with method)
//   _moment.humanizeDuration:  (operator with method)
// In YAML context, these appear as keys — preceded by whitespace, dash+space, or start of line
const PATTERN = /(?<=^|\s|-)_moment(?=\.|:)/gm;

const affected = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const matches = content.match(PATTERN);
  if (matches && matches.length > 0) {
    affected.push({ file, content, matchCount: matches.length });
  }
}

if (affected.length === 0) {
  console.log('No files affected. Nothing to do.');
  process.exit(0);
}

console.log('Files affected:');
for (const { file, matchCount } of affected) {
  console.log(`  ${file} (${matchCount} occurrence${matchCount > 1 ? 's' : ''})`);
}

const totalMatches = affected.reduce((sum, a) => sum + a.matchCount, 0);
console.log(`\nTotal: ${affected.length} file(s), ${totalMatches} occurrence(s)`);

if (apply) {
  mkdirSync('.codemod-backup', { recursive: true });
  for (const { file } of affected) {
    const backupPath = join('.codemod-backup', file);
    mkdirSync(dirname(backupPath), { recursive: true });
    copyFileSync(file, backupPath);
  }
  console.log('\nBackups saved to .codemod-backup/');

  let changeCount = 0;
  for (const { file, content } of affected) {
    const updated = content.replace(PATTERN, '_dayjs');
    if (updated !== content) {
      writeFileSync(file, updated, 'utf8');
      changeCount++;
    }
  }
  console.log(`Changes applied to ${changeCount} file(s).`);
} else {
  console.log('\nChanges that would be applied:');
  for (const { file, content } of affected) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (PATTERN.test(line)) {
        const updated = line.replace(PATTERN, '_dayjs');
        console.log(`  ${file}:${i + 1}:`);
        console.log(`    - ${line.trim()}`);
        console.log(`    + ${updated.trim()}`);
      }
      // Reset lastIndex since we're using /g flag
      PATTERN.lastIndex = 0;
    });
  }
  console.log('\nRun with --apply to make changes.');
}
