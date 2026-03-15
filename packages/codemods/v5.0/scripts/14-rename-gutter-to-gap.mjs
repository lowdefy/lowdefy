#!/usr/bin/env node
// Migration: Rename `gutter` → `gap` and `contentGutter` → `contentGap` in slot config
// Category: A (deterministic — unambiguous key rename)
// Affects: slots.*.gutter, contentGutter in all container blocks
//
// Usage:
//   node scripts/02-rename-gutter-to-gap.mjs [--apply] [directory]
//
// Without --apply, runs in dry-run mode (reports changes without modifying files).
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

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const targetDir = args.find(a => a !== '--apply') || '.';

console.log('=== Migration: Rename gutter → gap ===');
console.log(`Target: ${targetDir}`);
console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

const files = findYamlFiles(targetDir);

// Pattern 1: `gutter:` as a YAML key (area gap config)
const GUTTER_KEY = /^(\s*)gutter:/gm;

// Pattern 2: `contentGutter:` as a YAML key (content inheritance)
const CONTENT_GUTTER_KEY = /^(\s*)contentGutter:/gm;

const affected = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const changes = [];

  const gutterMatches = (content.match(GUTTER_KEY) || []).length;
  const contentGutterMatches = (content.match(CONTENT_GUTTER_KEY) || []).length;

  if (gutterMatches > 0) changes.push(`${gutterMatches} gutter:`);
  if (contentGutterMatches > 0) changes.push(`${contentGutterMatches} contentGutter:`);

  if (changes.length > 0) {
    affected.push({ file, content, changes });
  }
}

if (affected.length === 0) {
  console.log('No files contain `gutter` or `contentGutter` references. Nothing to do.');
  process.exit(0);
}

console.log(`Found ${affected.length} file(s) with gutter references:\n`);

for (const { file, content, changes } of affected) {
  const rel = relative(targetDir, file);
  console.log(`  ${rel}: ${changes.join(', ')}`);

  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/\bgutter\b/i.test(line)) {
      console.log(`    L${i + 1}: ${line.trimEnd()}`);
    }
  });
  console.log();
}

const totalChanges = affected.reduce((sum, { changes }) =>
  sum + changes.reduce((s, c) => s + parseInt(c), 0), 0
);
console.log(`Total: ${totalChanges} replacement(s) across ${affected.length} file(s)\n`);

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
  for (const { file, content } of affected) {
    let updated = content;
    // Order matters: contentGutter before gutter to avoid partial match
    updated = updated.replace(CONTENT_GUTTER_KEY, '$1contentGap:');
    updated = updated.replace(GUTTER_KEY, '$1gap:');

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
