#!/usr/bin/env node
// Migration: Tabs `tabPosition` → `tabPlacement` with value mapping.
// Category: A (deterministic)
// Affects: Tabs
//
// Value mapping:
//   left   → start
//   right  → end
//   top    → top (unchanged)
//   bottom → bottom (unchanged)
//
// Usage:
//   node scripts/06-tabs-position-to-placement.mjs [--apply] [directory]

import { runMigration, findCodeBlockLines } from './_utils.mjs';

const VALUE_MAP = {
  left: 'start',
  right: 'end',
  top: 'top',
  bottom: 'bottom',
};

runMigration({
  name: 'Tabs tabPosition → tabPlacement with value mapping',
  transform(content) {
    const changes = [];
    const codeBlockLines = findCodeBlockLines(content);
    const lines = content.split('\n');
    const output = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (codeBlockLines.has(i)) {
        output.push(line);
        continue;
      }

      const valueMatch = line.match(/^(\s+)tabPosition:\s*(left|right|top|bottom)\s*$/);
      if (valueMatch) {
        const mapped = VALUE_MAP[valueMatch[2]] || valueMatch[2];
        changes.push(`tabPosition: ${valueMatch[2]} → tabPlacement: ${mapped}`);
        output.push(`${valueMatch[1]}tabPlacement: ${mapped}`);
        continue;
      }

      const exprMatch = line.match(/^(\s+)tabPosition:/);
      if (exprMatch) {
        changes.push('tabPosition → tabPlacement (expression value — verify mapping)');
        output.push(line.replace(/^(\s+)tabPosition:/, '$1tabPlacement:'));
        continue;
      }

      output.push(line);
    }

    return { output: output.join('\n'), changes };
  },
});
