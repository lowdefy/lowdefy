#!/usr/bin/env node
// Migration: Detect custom date format strings that may differ between moment and dayjs.
// Category: B (semi-deterministic — reporting only)
// Affects: DateSelector, DateRangeSelector, DateTimeSelector, MonthSelector, WeekSelector
//
// Standard ISO date formats work identically in moment and dayjs.
// This script flags files using custom `format` strings on date blocks so
// developers can verify they work with dayjs.
//
// Usage:
//   node scripts/11-detect-date-formats.mjs [--apply] [directory]

import { runMigration } from './_utils.mjs';

const DATE_BLOCKS = [
  'DateSelector',
  'DateRangeSelector',
  'DateTimeSelector',
  'MonthSelector',
  'WeekSelector',
];

const DATE_BLOCK_PATTERN = new RegExp(`type:\\s*(${DATE_BLOCKS.join('|')})\\s*$`);

runMigration({
  name: 'Detect custom date format strings (moment → dayjs)',
  transform(content) {
    // This script only reports — no transformations
    return { output: content, changes: [] };
  },
  report(file, content) {
    if (!DATE_BLOCK_PATTERN.test(content)) return [];

    const items = [];
    const lines = content.split('\n');
    let inDateBlock = false;
    let inProps = false;
    let blockType = '';
    let blockIndent = -1;
    let propsIndent = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const stripped = line.trimStart();
      const indent = line.length - stripped.length;

      const blockMatch = stripped.match(new RegExp(`^type:\\s*(${DATE_BLOCKS.join('|')})\\s*$`));
      if (blockMatch) {
        inDateBlock = true;
        blockType = blockMatch[1];
        blockIndent = indent - 2;
        continue;
      }

      if (inDateBlock && stripped.match(/^properties:\s*$/)) {
        inProps = true;
        propsIndent = indent;
        continue;
      }

      if (inProps && indent === propsIndent + 2) {
        const formatMatch = stripped.match(/^format:\s*(.+)$/);
        if (formatMatch) {
          const value = formatMatch[1].trim();
          // Skip standard/default formats
          if (!value.startsWith('_') && value !== 'YYYY-MM-DD' && value !== 'YYYY-MM-DD HH:mm:ss') {
            items.push(`Line ${i + 1}: ${blockType} uses custom format: ${value} — verify dayjs compatibility`);
          }
        }
      }

      if (stripped.match(/^-\s+id:/) && indent <= blockIndent) {
        inDateBlock = false;
        inProps = false;
      }
    }

    return items;
  },
});
