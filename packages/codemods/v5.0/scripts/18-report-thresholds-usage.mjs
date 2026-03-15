#!/usr/bin/env node
// Migration: Report thresholds usage in _moment/_dayjs humanizeDuration calls
// Category: B (Semi-Deterministic — report only, no auto-fix)
// Affects: YAML files using thresholds with _moment.humanizeDuration or _dayjs.humanizeDuration
//
// In Lowdefy v5, the `thresholds` parameter on humanizeDuration is accepted but ignored.
// Dayjs only supports global thresholds, not per-call thresholds like moment.
// This script finds YAML configs that use thresholds so developers can review whether
// they depend on custom threshold behavior.
//
// Usage:
//   node scripts/02-report-thresholds-usage.mjs [directory]
//
// This script is report-only — it never modifies files.

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

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
const targetDir = args.find(a => !a.startsWith('-')) || '.';

console.log('=== Report: thresholds usage in humanizeDuration ===');
console.log(`Target: ${targetDir}\n`);

const files = findYamlFiles(targetDir);

// Look for humanizeDuration usage that includes thresholds
// Patterns in YAML:
//   _moment.humanizeDuration:   or   _dayjs.humanizeDuration:
//     thresholds:
//       d: 7
//       w: 4
//
// We search for thresholds near humanizeDuration context.
// Two-pass: first find files with humanizeDuration, then check for thresholds nearby.

const HAS_HUMANIZE = /(?:_moment|_dayjs)\.humanizeDuration/;
const THRESHOLDS_LINE = /^\s+thresholds:/;

const findings = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  if (!HAS_HUMANIZE.test(content)) continue;

  const lines = content.split('\n');
  let inHumanizeBlock = false;
  let humanizeLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/(?:_moment|_dayjs)\.humanizeDuration/.test(line)) {
      inHumanizeBlock = true;
      humanizeLine = i;
      continue;
    }

    if (inHumanizeBlock && THRESHOLDS_LINE.test(line)) {
      findings.push({
        file,
        humanizeLine: humanizeLine + 1,
        thresholdsLine: i + 1,
        context: lines.slice(humanizeLine, Math.min(i + 4, lines.length)).join('\n'),
      });
      inHumanizeBlock = false;
      continue;
    }

    // Reset if we hit a new top-level key (not indented more than humanizeDuration)
    if (inHumanizeBlock && line.trim() && !/^\s/.test(line)) {
      inHumanizeBlock = false;
    }
  }
}

if (findings.length === 0) {
  console.log('No thresholds usage found. Nothing to review.');
  process.exit(0);
}

console.log('=== REVIEW NEEDED ===\n');
console.log('The following configs use `thresholds` with humanizeDuration.');
console.log('In Lowdefy v5 (dayjs), thresholds is accepted but IGNORED.');
console.log('Dayjs uses default thresholds (same as moment defaults).');
console.log('If your app depends on custom threshold behavior, you will need');
console.log('an alternative approach.\n');

for (const { file, humanizeLine, thresholdsLine, context } of findings) {
  console.log(`--- ${file}:${thresholdsLine} ---`);
  console.log(context);
  console.log();
}

console.log(`Total: ${findings.length} usage(s) of thresholds found in ${new Set(findings.map(f => f.file)).size} file(s).`);
console.log('\nAction: Review each usage. If your app depends on custom thresholds');
console.log('(changing when durations switch units), the output will now use dayjs defaults.');
console.log('For most apps, the defaults are identical to moment defaults — no change needed.');
