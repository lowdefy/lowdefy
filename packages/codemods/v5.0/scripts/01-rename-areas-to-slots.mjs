#!/usr/bin/env node
// Migration: Rename `areas` key to `slots` on all blocks.
// Category: A (deterministic)
// Affects: All container/layout blocks
//
// Usage:
//   node scripts/01-rename-areas-to-slots.mjs [--apply] [directory]

import { runMigration, findCodeBlockLines } from './_utils.mjs';

runMigration({
  name: 'Rename areas → slots',
  transform(content) {
    const changes = [];
    const codeBlockLines = findCodeBlockLines(content);
    const lines = content.split('\n');
    const output = lines.map((line, i) => {
      if (codeBlockLines.has(i)) return line;
      const match = line.match(/^(\s*)areas:/);
      if (match) {
        changes.push(`areas: → slots: (indent ${match[1].length})`);
        return line.replace(/^(\s*)areas:/, '$1slots:');
      }
      return line;
    });
    return { output: output.join('\n'), changes };
  },
});
