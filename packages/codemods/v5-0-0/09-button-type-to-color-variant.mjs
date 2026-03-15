#!/usr/bin/env node
// Migration: Button `type`/`danger` → `color` + `variant`.
// Category: B (semi-deterministic + review)
// Affects: Button
//
// Mapping:
//   type: primary              → color: primary, variant: solid
//   type: default (or omitted) → (no change needed, default)
//   type: dashed               → variant: dashed
//   type: text                 → variant: text
//   type: link                 → variant: link
//   danger: true               → color: danger
//   type: primary + danger     → color: danger, variant: solid
//
// Usage:
//   node scripts/09-button-type-to-color-variant.mjs [--apply] [directory]

import { runMigration, findCodeBlockLines } from './_utils.mjs';

runMigration({
  name: 'Button type/danger → color + variant',
  transform(content) {
    if (!content.includes('type: Button')) {
      return { output: content, changes: [] };
    }

    const changes = [];
    const lines = content.split('\n');
    const codeBlockLines = findCodeBlockLines(content);
    const result = [];
    let inButton = false;
    let inButtonProps = false;
    let buttonBaseIndent = -1;
    let propsIndent = -1;

    // Collect button properties for batch processing
    let buttonPropsStart = -1;
    let buttonPropsLines = [];

    function flushButton() {
      if (buttonPropsLines.length === 0) return;

      let hasType = null;
      let hasDanger = false;
      let typeLineIdx = -1;
      let dangerLineIdx = -1;

      for (let j = 0; j < buttonPropsLines.length; j++) {
        const pl = buttonPropsLines[j];
        const typeMatch = pl.line.match(/^\s+type:\s*(primary|default|dashed|text|link)\s*$/);
        if (typeMatch) {
          hasType = typeMatch[1];
          typeLineIdx = j;
        }
        const dangerMatch = pl.line.match(/^\s+danger:\s*(true|false)\s*$/);
        if (dangerMatch && dangerMatch[1] === 'true') {
          hasDanger = true;
          dangerLineIdx = j;
        }
      }

      if (hasType === null && !hasDanger) {
        // No Button-specific type or danger — output as-is
        for (const pl of buttonPropsLines) result.push(pl.line);
        buttonPropsLines = [];
        return;
      }

      const indent = buttonPropsLines[0]?.line.match(/^(\s+)/)?.[1] || '      ';

      for (let j = 0; j < buttonPropsLines.length; j++) {
        const pl = buttonPropsLines[j];

        if (j === typeLineIdx) {
          // Replace type line based on mapping
          if (hasType === 'primary') {
            if (hasDanger) {
              result.push(`${indent}color: danger`);
              result.push(`${indent}variant: solid`);
              changes.push('type: primary + danger → color: danger, variant: solid');
            } else {
              result.push(`${indent}color: primary`);
              result.push(`${indent}variant: solid`);
              changes.push('type: primary → color: primary, variant: solid');
            }
          } else if (hasType === 'default') {
            // Default is the default — skip the type line
            if (hasDanger) {
              result.push(`${indent}color: danger`);
              changes.push('type: default + danger → color: danger');
            } else {
              changes.push('type: default → removed (is the default)');
            }
          } else if (hasType === 'dashed') {
            result.push(`${indent}variant: dashed`);
            if (hasDanger) result.push(`${indent}color: danger`);
            changes.push(`type: dashed → variant: dashed`);
          } else if (hasType === 'text') {
            result.push(`${indent}variant: text`);
            if (hasDanger) result.push(`${indent}color: danger`);
            changes.push(`type: text → variant: text`);
          } else if (hasType === 'link') {
            result.push(`${indent}variant: link`);
            if (hasDanger) result.push(`${indent}color: danger`);
            changes.push(`type: link → variant: link`);
          }
          continue;
        }

        if (j === dangerLineIdx) {
          // danger: true is handled above with type
          // If no type but danger, add color: danger
          if (hasType === null) {
            result.push(`${indent}color: danger`);
            changes.push('danger: true → color: danger');
          }
          // Skip the danger line either way
          continue;
        }

        result.push(pl.line);
      }

      buttonPropsLines = [];
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (codeBlockLines.has(i)) { result.push(line); continue; }
      const stripped = line.trimStart();
      const indent = line.length - stripped.length;

      if (stripped.match(/^type:\s*Button\s*$/)) {
        inButton = true;
        buttonBaseIndent = indent - 2;
        result.push(line);
        continue;
      }

      if (inButton && stripped.match(/^properties:\s*$/)) {
        inButtonProps = true;
        propsIndent = indent;
        result.push(line);
        continue;
      }

      if (inButtonProps) {
        if (indent <= propsIndent && stripped !== '') {
          flushButton();
          inButtonProps = false;
          if (indent <= buttonBaseIndent) inButton = false;
          result.push(line);
          continue;
        }
        if (indent === propsIndent + 2) {
          buttonPropsLines.push({ line, idx: i });
          continue;
        }
        // Nested under a property
        buttonPropsLines.push({ line, idx: i });
        continue;
      }

      if (stripped.match(/^-\s+id:/) && indent <= buttonBaseIndent) {
        flushButton();
        inButton = false;
        inButtonProps = false;
      }

      result.push(line);
    }

    flushButton();

    return { output: result.join('\n'), changes };
  },
  report(file, content) {
    if (!content.includes('type: Button')) return [];
    const items = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      // Flag Buttons with expression-based type values
      if (lines[i].match(/^\s+type:\s*$/) || lines[i].match(/^\s+type:\s+_/)) {
        items.push(`Line ${i + 1}: Button type uses an expression — verify mapping manually`);
      }
    }
    return items;
  },
});
