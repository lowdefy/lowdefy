#!/usr/bin/env node
// Migration: Divider dual rename — type↔orientation swap.
// Category: B (semi-deterministic + review)
// Affects: Divider
//
// In antd v4:
//   type: horizontal|vertical        (direction)
//   orientation: left|center|right    (text position)
//
// In antd v6:
//   orientation: horizontal|vertical  (direction — was "type")
//   titlePlacement: start|center|end  (text position — was "orientation")
//
// Value mapping for titlePlacement:
//   left   → start
//   center → center
//   right  → end
//
// This is a dual swap — both properties change meaning simultaneously.
// The script uses a two-pass approach with temporary placeholders.
//
// Usage:
//   node scripts/08-divider-dual-rename.mjs [--apply] [directory]

import { runMigration, findCodeBlockLines } from './_utils.mjs';

const TITLE_VALUE_MAP = { left: 'start', center: 'center', right: 'end' };

// Unique placeholders that won't appear in YAML
const TYPE_PLACEHOLDER = '__CODEMOD_DIVIDER_TYPE__';
const ORIENT_PLACEHOLDER = '__CODEMOD_DIVIDER_ORIENT__';

runMigration({
  name: 'Divider dual rename: type↔orientation',
  transform(content) {
    // Only process files that mention Divider
    if (!content.includes('type: Divider')) {
      return { output: content, changes: [] };
    }

    const changes = [];

    // We need to be context-aware — only rename within Divider blocks.
    // For safety, we process line-by-line tracking Divider context.
    const lines = content.split('\n');
    const codeBlockLines = findCodeBlockLines(content);
    const result = [];
    let inDivider = false;
    let inDividerProps = false;
    let dividerBaseIndent = -1;
    let propsIndent = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (codeBlockLines.has(i)) { result.push(line); continue; }
      const stripped = line.trimStart();
      const indent = line.length - stripped.length;

      if (stripped.match(/^type:\s*Divider\s*$/)) {
        inDivider = true;
        dividerBaseIndent = indent - 2;
        result.push(line);
        continue;
      }

      if (inDivider && stripped.match(/^properties:\s*$/)) {
        inDividerProps = true;
        propsIndent = indent;
        result.push(line);
        continue;
      }

      if (inDividerProps) {
        if (indent <= propsIndent && stripped !== '') {
          inDividerProps = false;
          if (indent <= dividerBaseIndent) inDivider = false;
        } else if (indent === propsIndent + 2) {
          // Divider's `type:` (direction) → `orientation:`
          const typeMatch = stripped.match(/^type:\s*(horizontal|vertical)\s*$/);
          if (typeMatch) {
            changes.push(`Line ${i + 1}: type: ${typeMatch[1]} → orientation: ${typeMatch[1]}`);
            result.push(line.replace(/^(\s+)type:/, `$1orientation:`));
            continue;
          }

          // Divider's `orientation:` (text position) → `titlePlacement:` with value map
          const orientMatch = stripped.match(/^orientation:\s*(left|center|right)\s*$/);
          if (orientMatch) {
            const mapped = TITLE_VALUE_MAP[orientMatch[1]] || orientMatch[1];
            changes.push(`Line ${i + 1}: orientation: ${orientMatch[1]} → titlePlacement: ${mapped}`);
            result.push(line.replace(/^(\s+)orientation:\s*\S+/, `$1titlePlacement: ${mapped}`));
            continue;
          }
        }
      }

      // Reset on new block
      if (stripped.match(/^-\s+id:/) && indent <= dividerBaseIndent) {
        inDivider = false;
        inDividerProps = false;
      }

      result.push(line);
    }

    return { output: result.join('\n'), changes };
  },
  report(file, content) {
    if (!content.includes('type: Divider')) return [];
    const items = [];
    const lines = content.split('\n');
    let inDivider = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('type: Divider')) inDivider = true;
      if (inDivider && lines[i].match(/^\s+(type|orientation):/)) {
        items.push(`Line ${i + 1}: Verify Divider dual rename is correct — ${lines[i].trim()}`);
      }
      if (inDivider && lines[i].match(/^-\s+id:/)) inDivider = false;
    }
    return items;
  },
});
