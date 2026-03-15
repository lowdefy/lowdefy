// Shared utilities for codemod scripts.
// No npm dependencies — Node.js built-in modules only.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';

/**
 * Recursively find all .yaml and .yml files in a directory.
 * Skips hidden directories (starting with .) and node_modules.
 */
export function findYamlFiles(dir) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        walk(full);
      } else if (entry.isFile() && /\.ya?ml(\.njk)?$/.test(entry.name)) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

/**
 * Parse CLI arguments. Returns { apply, targetDir }.
 */
export function parseArgs() {
  const args = process.argv.slice(2);
  return {
    apply: args.includes('--apply'),
    targetDir: args.find(a => a !== '--apply') || '.',
  };
}

/**
 * Back up a file to .codemod-backup/ preserving relative path.
 */
export function backupFile(file, targetDir) {
  const rel = relative(targetDir, file);
  const backupPath = join('.codemod-backup', rel);
  mkdirSync(dirname(backupPath), { recursive: true });
  copyFileSync(file, backupPath);
}

/**
 * Build a Set of line indices that fall inside markdown code blocks (``` ... ```).
 * These lines should be skipped by codemods to avoid modifying documentation examples.
 */
export function findCodeBlockLines(content) {
  const lines = content.split('\n');
  const skip = new Set();
  let inBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) {
      if (inBlock) {
        skip.add(i);
        inBlock = false;
      } else {
        skip.add(i);
        inBlock = true;
      }
    } else if (inBlock) {
      skip.add(i);
    }
  }
  return skip;
}

/**
 * Run a codemod migration.
 *
 * @param {object} opts
 * @param {string} opts.name - Migration name for display
 * @param {function} opts.transform - (content: string, filePath: string) => { output: string, changes: string[] }
 *   Returns the transformed content and a list of human-readable change descriptions.
 *   If no changes, return { output: content, changes: [] }.
 * @param {function} [opts.report] - (filePath: string, content: string) => string[]
 *   Optional. Returns lines for a "REVIEW NEEDED" section.
 */
export function runMigration({ name, transform, report }) {
  const { apply, targetDir } = parseArgs();

  console.log(`=== Migration: ${name} ===`);
  console.log(`Target: ${targetDir}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

  const files = findYamlFiles(targetDir);
  const affected = [];
  const reviewItems = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const { output, changes } = transform(content, file);
    if (changes.length > 0) {
      affected.push({ file, content, output, changes });
    }
    if (report) {
      const items = report(file, content);
      if (items.length > 0) {
        reviewItems.push({ file, items });
      }
    }
  }

  if (affected.length === 0 && reviewItems.length === 0) {
    console.log('No files affected. Nothing to do.');
    process.exit(0);
  }

  if (affected.length > 0) {
    console.log('Files affected:');
    for (const { file, changes } of affected) {
      console.log(`  ${file}`);
      for (const c of changes) console.log(`    - ${c}`);
    }
    console.log(`\nTotal: ${affected.length} file(s)\n`);
  }

  if (apply && affected.length > 0) {
    mkdirSync('.codemod-backup', { recursive: true });
    for (const { file } of affected) {
      backupFile(file, targetDir);
    }
    console.log('Backups saved to .codemod-backup/');

    let changeCount = 0;
    for (const { file, output, content } of affected) {
      if (output !== content) {
        writeFileSync(file, output, 'utf8');
        changeCount++;
      }
    }
    console.log(`Changes applied to ${changeCount} file(s).`);
  } else if (!apply && affected.length > 0) {
    console.log('Run with --apply to make changes.');
  }

  if (reviewItems.length > 0) {
    console.log('\n=== REVIEW NEEDED ===\n');
    for (const { file, items } of reviewItems) {
      console.log(`  ${file}:`);
      for (const item of items) console.log(`    ${item}`);
    }
    console.log('\nPlease review the items above manually.');
  }
}
