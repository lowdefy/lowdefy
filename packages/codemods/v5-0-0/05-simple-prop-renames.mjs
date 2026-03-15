#!/usr/bin/env node
// Migration: Simple property and event renames across multiple blocks.
// Category: A (deterministic)
//
// Renames:
//   Modal:    visible → open (property-level, NOT block-level visible)
//   Tooltip:  defaultVisible → defaultOpen
//   Tooltip:  onVisibleChange → onOpenChange (event)
//   Progress: gapPosition → gapPlacement
//   Carousel: dotPosition → dotPlacement
//   Collapse: expandIconPosition → expandIconPlacement
//
// IMPORTANT: `visible` is a top-level block key on ALL blocks (controls visibility).
// Only Modal has a `visible` PROPERTY (controls open state). This script must
// distinguish between block-level `visible:` and Modal `properties.visible:`.
//
// Usage:
//   node scripts/05-simple-prop-renames.mjs [--apply] [directory]

import { runMigration, findCodeBlockLines } from './_utils.mjs';

// Property renames that are safe to match by key name alone (unique to one block type)
const SIMPLE_RENAMES = [
  { old: 'defaultVisible', new: 'defaultOpen', context: 'Tooltip' },
  { old: 'gapPosition', new: 'gapPlacement', context: 'Progress' },
  { old: 'dotPosition', new: 'dotPlacement', context: 'Carousel' },
  { old: 'expandIconPosition', new: 'expandIconPlacement', context: 'Collapse' },
];

const EVENT_RENAMES = [
  { old: 'onVisibleChange', new: 'onOpenChange', context: 'Tooltip' },
];

runMigration({
  name: 'Simple property and event renames',
  transform(content) {
    const changes = [];
    const lines = content.split('\n');
    const codeBlockLines = findCodeBlockLines(content);
    const output = [];

    // Simple renames — safe to match globally since the key names are unique
    let result = content;
    for (const { old: oldName, new: newName, context } of SIMPLE_RENAMES) {
      const pattern = new RegExp(`^(\\s+)${oldName}:`, 'gm');
      if (pattern.test(result)) {
        pattern.lastIndex = 0;
        result = result.replace(pattern, (match, indent) => {
          changes.push(`${oldName} → ${newName} (${context})`);
          return `${indent}${newName}:`;
        });
      }
    }
    for (const { old: oldName, new: newName, context } of EVENT_RENAMES) {
      const pattern = new RegExp(`^(\\s+)${oldName}:`, 'gm');
      if (pattern.test(result)) {
        pattern.lastIndex = 0;
        result = result.replace(pattern, (match, indent) => {
          changes.push(`event ${oldName} → ${newName} (${context})`);
          return `${indent}${newName}:`;
        });
      }
    }

    // Modal `visible` → `open` — context-aware: only rename when inside
    // a Modal block's `properties:` section (NOT the block-level `visible:` key)
    const resultLines = result.split('\n');
    const resultCodeBlockLines = findCodeBlockLines(result);
    for (let i = 0; i < resultLines.length; i++) {
      const line = resultLines[i];

      if (resultCodeBlockLines.has(i)) {
        output.push(line);
        continue;
      }

      // Match `visible:` — check if it's inside a Modal properties block
      const visMatch = line.match(/^(\s+)visible:/);
      if (visMatch) {
        const visIndent = visMatch[1].length;
        // Look backwards for the containing `properties:` and then `type: Modal`
        if (isInsideModalProperties(resultLines, i, visIndent)) {
          changes.push('visible → open (Modal)');
          output.push(line.replace(/^(\s+)visible:/, '$1open:'));
          continue;
        }
      }
      output.push(line);
    }

    return { output: output.join('\n'), changes };
  },
});

/**
 * Check if a `visible:` key at the given line/indent is inside a Modal block's
 * `properties:` section by scanning backwards.
 */
function isInsideModalProperties(lines, lineIdx, visibleIndent) {
  // `visible:` must be a direct child of `properties:` which is a direct child
  // of a block with `type: Modal`.
  // Expected structure:
  //   - id: xxx          (indent N)
  //     type: Modal      (indent N+2)
  //     properties:      (indent N+2)
  //       visible: true  (indent N+4)
  //
  // So `properties:` should be at visibleIndent - 2, and `type: Modal` at the same level.

  const propsIndent = visibleIndent - 2;
  if (propsIndent < 0) return false;

  // Scan backwards to find the `properties:` line at the expected indent
  let propsLine = -1;
  for (let j = lineIdx - 1; j >= 0; j--) {
    const l = lines[j].replace(/\s+$/, '');
    if (l === '') continue;
    const indent = lines[j].match(/^(\s*)/)[1].length;
    if (indent <= propsIndent) {
      if (indent === propsIndent && /^\s*properties:\s*$/.test(l)) {
        propsLine = j;
      }
      break;
    }
  }
  if (propsLine === -1) return false;

  // From properties, scan backwards to find `type:` at the same indent level
  for (let j = propsLine - 1; j >= 0; j--) {
    const l = lines[j].replace(/\s+$/, '');
    if (l === '') continue;
    const indent = lines[j].match(/^(\s*)/)[1].length;
    if (indent < propsIndent) break;
    if (indent === propsIndent && /^\s*type:\s*Modal\s*$/.test(l)) {
      return true;
    }
  }

  return false;
}
