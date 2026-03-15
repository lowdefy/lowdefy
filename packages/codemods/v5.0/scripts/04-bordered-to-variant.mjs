#!/usr/bin/env node
// Migration: Convert `bordered: false` → `variant: borderless`.
// Category: A (deterministic)
// Affects: AutoComplete, Card, Collapse, DateRangeSelector, DateSelector,
//          DateTimeSelector, Descriptions, MonthSelector, MultipleSelector,
//          NumberInput, PasswordInput, PhoneNumberInput, Selector, TextArea,
//          TextInput, WeekSelector
//
// Usage:
//   node scripts/04-bordered-to-variant.mjs [--apply] [directory]

import { runMigration, findCodeBlockLines } from './_utils.mjs';

runMigration({
  name: 'Convert bordered: false → variant: borderless',
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

      const falseMatch = line.match(/^(\s+)bordered:\s*(false|"false"|'false')\s*$/);
      if (falseMatch) {
        changes.push('bordered: false → variant: borderless');
        output.push(`${falseMatch[1]}variant: borderless`);
        continue;
      }

      const trueMatch = line.match(/^(\s+)bordered:\s*(true|"true"|'true')\s*$/);
      if (trueMatch) {
        changes.push('bordered: true → removed (default)');
        // Skip the line (remove it)
        continue;
      }

      output.push(line);
    }

    return { output: output.join('\n'), changes };
  },
});
