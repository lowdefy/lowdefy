#!/usr/bin/env node
// Migration: Detect `public/styles.less` and map known Less variables to antd tokens.
// Category: B (semi-deterministic + review)
// Affects: Apps with custom Less stylesheets
//
// Known variable mappings:
//   @primary-color       → colorPrimary
//   @border-radius-base  → borderRadius
//   @font-size-base      → fontSize
//   @heading-color       → colorText (approximate)
//   @text-color          → colorText
//   @text-color-secondary → colorTextSecondary
//   @font-family         → fontFamily
//   @link-color          → colorLink
//   @success-color       → colorSuccess
//   @warning-color       → colorWarning
//   @error-color         → colorError
//
// Usage:
//   node scripts/10-detect-styles-less.mjs [--apply] [directory]

import { readFileSync, existsSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';

const LESS_VAR_MAP = {
  '@primary-color': 'colorPrimary',
  '@border-radius-base': 'borderRadius',
  '@font-size-base': 'fontSize',
  '@heading-color': 'colorText',
  '@text-color': 'colorText',
  '@text-color-secondary': 'colorTextSecondary',
  '@font-family': 'fontFamily',
  '@link-color': 'colorLink',
  '@success-color': 'colorSuccess',
  '@warning-color': 'colorWarning',
  '@error-color': 'colorError',
  '@info-color': 'colorInfo',
  '@body-background': 'colorBgLayout',
  '@component-background': 'colorBgContainer',
};

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const targetDir = args.find(a => a !== '--apply') || '.';

const lessPath = join(targetDir, 'public', 'styles.less');

console.log('=== Migration: Detect styles.less → theme YAML / styles.css ===');
console.log(`Target: ${targetDir}`);
console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

if (!existsSync(lessPath)) {
  console.log('No public/styles.less found. Nothing to do.');
  process.exit(0);
}

const content = readFileSync(lessPath, 'utf8');
const lines = content.split('\n');

const simpleVars = [];
const complexLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

  // Match simple variable assignment: @var-name: value;
  const varMatch = line.match(/^(@[\w-]+):\s*([^;]+);?\s*$/);
  if (varMatch) {
    const [, varName, value] = varMatch;
    const tokenName = LESS_VAR_MAP[varName];
    if (tokenName) {
      simpleVars.push({ varName, tokenName, value: value.trim(), line: i + 1 });
    } else {
      complexLines.push({ line: i + 1, content: line, reason: 'Unknown Less variable' });
    }
  } else if (line.includes('(') || line.includes('{') || line.includes('&')) {
    complexLines.push({ line: i + 1, content: line, reason: 'Less expression/mixin/nesting' });
  } else if (line) {
    complexLines.push({ line: i + 1, content: line, reason: 'Non-variable CSS' });
  }
}

if (simpleVars.length > 0) {
  console.log('Mappable Less variables:');
  console.log('\n  # Add to lowdefy.yaml:\n  theme:\n    antd:\n      token:');
  for (const { varName, tokenName, value } of simpleVars) {
    // Clean up value — remove quotes if present, format as YAML
    const cleanValue = value.replace(/^["']|["']$/g, '');
    console.log(`        ${tokenName}: ${cleanValue.startsWith('#') ? `"${cleanValue}"` : cleanValue}  # was ${varName}`);
  }
  console.log();
}

if (complexLines.length > 0) {
  console.log('=== REVIEW NEEDED ===\n');
  console.log('The following lines in public/styles.less cannot be auto-migrated:');
  for (const { line, content: c, reason } of complexLines) {
    console.log(`  Line ${line}: ${c}`);
    console.log(`    Reason: ${reason}`);
  }
  console.log('\nOptions:');
  console.log('  1. Convert to CSS and move to public/styles.css');
  console.log('  2. Use Tailwind utility classes via the new `class` property');
  console.log('  3. Use antd CSS variables: :root { --ant-color-primary: #value; }');
}

if (apply && simpleVars.length > 0) {
  console.log('\nNote: This script reports the YAML token mapping but does not modify lowdefy.yaml.');
  console.log('Copy the token block above into your lowdefy.yaml manually.');

  // Rename styles.less to styles.less.bak
  const bakPath = lessPath + '.bak';
  copyFileSync(lessPath, bakPath);
  console.log(`\nBacked up: ${lessPath} → ${bakPath}`);
  console.log('After adding theme tokens to lowdefy.yaml, delete public/styles.less');
}

if (!apply) {
  console.log('\nRun with --apply to back up styles.less.');
}
