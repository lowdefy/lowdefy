#!/usr/bin/env node
// Migration: Remove meta.styles from custom block plugins and add direct CSS imports.
// Category: B (semi-deterministic + review)
// Affects: Custom block plugins in Lowdefy app monorepos
//
// Detects:
//   1. Block JS files with `meta.styles = [...]` or `styles: [...]` on meta
//   2. types.js files with `styles` export or `meta.styles` aggregation
//   3. .less files in plugin directories that need conversion to .css
//
// Actions (--apply):
//   - Removes meta.styles from block component files
//   - Removes styles aggregation and export from types.js
//   - Renames .less → .css (non-antd custom CSS only)
//   - Adds `import './style.css'` to block component files
//   - Wraps CSS content in @layer components { }
//
// Usage:
//   node scripts/12-migrate-meta-styles.mjs [--apply] [directory]

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  renameSync,
  statSync,
} from 'fs';
import { join, dirname, relative, basename, extname } from 'path';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const targetDir = args.find((a) => a !== '--apply') || '.';

console.log('=== Migration: Remove meta.styles, add direct CSS imports ===');
console.log(`Target: ${targetDir}`);
console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}\n`);

// --- File discovery ---

function findFiles(dir, extensions, skipDirs = ['.', 'node_modules', '.codemod-backup', 'dist']) {
  const results = [];
  function walk(d) {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        if (skipDirs.some((s) => entry.name.startsWith(s))) continue;
        walk(full);
      } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function backupFile(file) {
  const rel = relative(targetDir, file);
  const backupPath = join('.codemod-backup', rel);
  mkdirSync(dirname(backupPath), { recursive: true });
  copyFileSync(file, backupPath);
}

// --- Detect custom plugin directories ---
// Look for plugin-like directories: any folder containing a types.js that exports styles

const jsFiles = findFiles(targetDir, ['.js', '.mjs', '.jsx']);
const lessFiles = findFiles(targetDir, ['.less']);

const changes = [];
const reviewItems = [];

// --- 1. Find types.js files with styles export ---

const typesFiles = jsFiles.filter((f) => basename(f) === 'types.js' || basename(f) === 'types.mjs');

for (const file of typesFiles) {
  const content = readFileSync(file, 'utf8');

  // Skip if no styles reference
  if (!content.includes('styles')) continue;

  // Check if it has the typical styles aggregation pattern
  const hasStylesAgg = /meta\.styles/.test(content);
  const hasStylesExport = /styles:\s*\{/.test(content);

  if (hasStylesAgg || hasStylesExport) {
    changes.push({
      file,
      type: 'types.js',
      description: 'Remove styles aggregation and export from types.js',
      content,
    });
  }
}

// --- 2. Find block component files with meta.styles ---

const blockFiles = jsFiles.filter(
  (f) => !basename(f).startsWith('types') && !basename(f).startsWith('_')
);

for (const file of blockFiles) {
  const content = readFileSync(file, 'utf8');

  // Match meta.styles = [...] or styles: [...] in a meta object
  const hasMetaStyles =
    /\.meta\.styles\s*=/.test(content) ||
    /meta\s*=\s*\{[^}]*styles\s*:\s*\[/.test(content);

  if (!hasMetaStyles) continue;

  // Extract style file paths from meta.styles
  const stylePathMatch = content.match(/styles\s*:\s*\[([^\]]*)\]/);
  const stylePaths = stylePathMatch
    ? stylePathMatch[1]
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .filter(Boolean)
    : [];

  changes.push({
    file,
    type: 'block',
    description: `Remove meta.styles (references: ${stylePaths.length > 0 ? stylePaths.join(', ') : 'empty'})`,
    content,
    stylePaths,
  });
}

// --- 3. Find .less files that may need conversion ---

for (const file of lessFiles) {
  const content = readFileSync(file, 'utf8');

  // Check if it's a pure antd re-import (dead code)
  const isAntdReimport =
    content.includes("@import 'antd/") ||
    content.includes('@import "antd/') ||
    content.includes("@import '~antd/") ||
    content.includes('@import "~antd/');
  const hasRealCSS = content
    .split('\n')
    .some(
      (line) =>
        line.trim() &&
        !line.trim().startsWith('//') &&
        !line.trim().startsWith('/*') &&
        !line.trim().startsWith('@import')
    );

  if (isAntdReimport && !hasRealCSS) {
    changes.push({
      file,
      type: 'less-dead',
      description: 'Delete — pure antd re-import (dead code with v6)',
      content,
    });
  } else {
    // Check for Less-specific features
    const hasLessVars = /@[\w-]+:/.test(content) || /\$[\w-]+/.test(content);
    const hasLessFunctions = /(lighten|darken|fade|spin|mix)\s*\(/.test(content);
    const hasLessMixins = /\.[a-zA-Z][\w-]*\s*\(/.test(content);

    if (hasLessVars || hasLessFunctions || hasLessMixins) {
      reviewItems.push({
        file,
        items: [
          'Contains Less-specific syntax that needs manual conversion:',
          ...(hasLessVars ? ['  - Less variables (@var or $var) → CSS custom properties'] : []),
          ...(hasLessFunctions
            ? ['  - Less functions (lighten/darken/etc.) → CSS color-mix() or antd tokens']
            : []),
          ...(hasLessMixins ? ['  - Less mixins → plain CSS or Tailwind utilities'] : []),
          'After converting, rename to .css and wrap content in @layer components { }',
        ],
      });
    }

    changes.push({
      file,
      type: 'less-convert',
      description: `Rename to .css, wrap in @layer components { }${hasLessVars || hasLessFunctions || hasLessMixins ? ' (NEEDS MANUAL LESS CONVERSION FIRST)' : ''}`,
      content,
      needsManualConversion: hasLessVars || hasLessFunctions || hasLessMixins,
    });
  }
}

// --- Report ---

if (changes.length === 0 && reviewItems.length === 0) {
  console.log('No custom block plugins with meta.styles or .less files found. Nothing to do.');
  process.exit(0);
}

console.log('Detected items:\n');

const typesChanges = changes.filter((c) => c.type === 'types.js');
const blockChanges = changes.filter((c) => c.type === 'block');
const deadLess = changes.filter((c) => c.type === 'less-dead');
const convertLess = changes.filter((c) => c.type === 'less-convert');

if (typesChanges.length > 0) {
  console.log('types.js files with styles export:');
  for (const c of typesChanges) console.log(`  ${c.file} — ${c.description}`);
  console.log();
}

if (blockChanges.length > 0) {
  console.log('Block files with meta.styles:');
  for (const c of blockChanges) console.log(`  ${c.file} — ${c.description}`);
  console.log();
}

if (deadLess.length > 0) {
  console.log('.less files to delete (antd re-imports):');
  for (const c of deadLess) console.log(`  ${c.file}`);
  console.log();
}

if (convertLess.length > 0) {
  console.log('.less files to convert to .css:');
  for (const c of convertLess) console.log(`  ${c.file} — ${c.description}`);
  console.log();
}

console.log(`Total: ${changes.length} item(s)\n`);

// --- Apply ---

if (apply) {
  mkdirSync('.codemod-backup', { recursive: true });
  let applied = 0;

  // 1. Remove meta.styles from block files and add direct CSS import
  for (const c of blockChanges) {
    backupFile(c.file);
    let content = c.content;

    // Remove meta.styles = [...]; pattern
    content = content.replace(/\s*\w+\.meta\.styles\s*=\s*\[[^\]]*\];\s*/g, '\n');

    // Remove styles: [...] from inline meta object
    content = content.replace(/,?\s*styles\s*:\s*\[[^\]]*\]/g, '');

    // Add direct CSS import for each style path that exists as .css
    for (const stylePath of c.stylePaths || []) {
      const cssPath = stylePath.replace(/\.less$/, '.css');
      // Convert package-relative path to file-relative
      const blockDir = dirname(c.file);
      const importPath = './' + relative(blockDir, join(dirname(c.file), '..', '..', cssPath)).replace(/\\/g, '/');

      // Only add import if not already present
      if (!content.includes(`import '${importPath}'`) && !content.includes(`import "${importPath}"`)) {
        // Add after the last import statement, or at the top
        const lastImportIdx = content.lastIndexOf('import ');
        if (lastImportIdx >= 0) {
          const lineEnd = content.indexOf('\n', lastImportIdx);
          content = content.slice(0, lineEnd + 1) + `import '${importPath}';\n` + content.slice(lineEnd + 1);
        } else {
          content = `import '${importPath}';\n` + content;
        }
      }
    }

    writeFileSync(c.file, content, 'utf8');
    applied++;
  }

  // 2. Remove styles from types.js
  for (const c of typesChanges) {
    backupFile(c.file);
    let content = c.content;

    // Remove: const styles = {};
    content = content.replace(/\s*const styles\s*=\s*\{\};\s*/g, '\n');

    // Remove: styles[block] = blocks[block].meta.styles ?? [];
    content = content.replace(/\s*styles\[block\]\s*=\s*blocks\[block\]\.meta\.styles\s*\?\?\s*\[\];\s*/g, '\n');

    // Remove styles from export: styles: { default: [...], ...styles },
    content = content.replace(/\s*styles:\s*\{[^}]*\},?\s*/g, '\n');

    writeFileSync(c.file, content, 'utf8');
    applied++;
  }

  // 3. Delete dead .less files (antd re-imports)
  for (const c of deadLess) {
    backupFile(c.file);
    // Don't actually delete — rename to .less.deleted so it's visible
    renameSync(c.file, c.file + '.deleted');
    applied++;
    console.log(`  Renamed to .deleted: ${c.file}`);
  }

  // 4. Convert .less → .css (only files without Less-specific syntax)
  for (const c of convertLess) {
    if (c.needsManualConversion) {
      console.log(`  SKIPPED (needs manual Less conversion first): ${c.file}`);
      continue;
    }
    backupFile(c.file);
    let content = c.content;

    // Remove antd @import lines
    content = content
      .split('\n')
      .filter(
        (line) =>
          !line.trim().startsWith("@import 'antd/") &&
          !line.trim().startsWith('@import "antd/') &&
          !line.trim().startsWith("@import '~antd/") &&
          !line.trim().startsWith('@import "~antd/')
      )
      .join('\n')
      .trim();

    // Wrap in @layer components
    if (content) {
      content = `@layer components {\n${content
        .split('\n')
        .map((line) => (line.trim() ? '  ' + line : line))
        .join('\n')}\n}\n`;
    }

    // Write as .css
    const cssPath = c.file.replace(/\.less$/, '.css');
    writeFileSync(cssPath, content, 'utf8');
    renameSync(c.file, c.file + '.deleted');
    applied++;
    console.log(`  Converted: ${c.file} → ${cssPath}`);
  }

  console.log(`\nApplied ${applied} change(s). Backups in .codemod-backup/`);
  console.log('\nNext steps:');
  console.log('  1. Delete all .less.deleted files after verifying the migration');
  console.log('  2. For files marked SKIPPED, manually convert Less syntax to CSS first');
  console.log('  3. Verify direct CSS imports are correct in block component files');
  console.log('  4. Test that block styles render correctly');
} else {
  console.log('Run with --apply to make changes.');
}

if (reviewItems.length > 0) {
  console.log('\n=== REVIEW NEEDED ===\n');
  for (const { file, items } of reviewItems) {
    console.log(`  ${file}:`);
    for (const item of items) console.log(`    ${item}`);
  }
  console.log('\nConvert Less syntax to CSS before running with --apply.');
}
