#!/usr/bin/env node
// Migration: Drop `content*` prefix from layout properties
// Category: A (deterministic — unambiguous key rename)
// Affects: contentGutter→gap, contentAlign→align, contentJustify→justify,
//          contentDirection→direction, contentWrap→wrap, contentOverflow→overflow,
//          contentGap→gap (intermediate rename from script 02)
//
// Usage:
//   node scripts/03-rename-content-prefix.mjs [--apply] [directory]
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

console.log('=== Migration: Drop content* prefix from layout properties ===');
console.log(`Target: ${targetDir}`);
console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

const files = findYamlFiles(targetDir);

// Patterns: each `content*` key as a YAML key (anchored to start-of-line with whitespace)
// Order matters: contentGutter and contentGap both map to gap, so handle them both.
const RENAMES = [
  { pattern: /^(\s*)contentGutter:/gm, replacement: '$1gap:', label: 'contentGutter → gap' },
  { pattern: /^(\s*)contentGap:/gm, replacement: '$1gap:', label: 'contentGap → gap' },
  { pattern: /^(\s*)contentAlign:/gm, replacement: '$1align:', label: 'contentAlign → align' },
  { pattern: /^(\s*)contentJustify:/gm, replacement: '$1justify:', label: 'contentJustify → justify' },
  { pattern: /^(\s*)contentDirection:/gm, replacement: '$1direction:', label: 'contentDirection → direction' },
  { pattern: /^(\s*)contentWrap:/gm, replacement: '$1wrap:', label: 'contentWrap → wrap' },
  { pattern: /^(\s*)contentOverflow:/gm, replacement: '$1overflow:', label: 'contentOverflow → overflow' },
];

const DETECT_PATTERN = /\bcontent(?:Gutter|Gap|Align|Justify|Direction|Wrap|Overflow)\b/;

const affected = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  if (!DETECT_PATTERN.test(content)) continue;

  const changes = [];
  for (const { pattern, label } of RENAMES) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    const matches = (content.match(pattern) || []).length;
    if (matches > 0) changes.push(`${matches} ${label}`);
  }

  if (changes.length > 0) {
    affected.push({ file, content, changes });
  }
}

if (affected.length === 0) {
  console.log('No files contain `content*` layout property references. Nothing to do.');
  process.exit(0);
}

console.log(`Found ${affected.length} file(s) with content* layout properties:\n`);

for (const { file, content, changes } of affected) {
  const rel = relative(targetDir, file);
  console.log(`  ${rel}: ${changes.join(', ')}`);

  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (DETECT_PATTERN.test(line)) {
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
    for (const { pattern, replacement } of RENAMES) {
      pattern.lastIndex = 0;
      updated = updated.replace(pattern, replacement);
    }

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
