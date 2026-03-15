#!/usr/bin/env node
// Migration: Move `properties.style` to `style: { --element }` on all blocks.
// Category: A (deterministic)
// Affects: Any block using properties.style
//
// Usage:
//   node scripts/02-migrate-properties-style.mjs [--apply] [directory]
//
// Note: This is a YAML-aware line-by-line transformation. It detects the
// `style:` key under `properties:` and moves its content to a `style: { --element }`
// block. Works for both single-line and multi-line style values.

import { runMigration, findCodeBlockLines } from './_utils.mjs';

runMigration({
  name: 'Move properties.style → style: { --element }',
  transform(content) {
    const changes = [];
    const lines = content.split('\n');
    const codeBlockLines = findCodeBlockLines(content);
    const output = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip lines inside markdown code blocks
      if (codeBlockLines.has(i)) {
        output.push(line);
        i++;
        continue;
      }

      // Detect `properties:` block
      const propsMatch = line.match(/^(\s*)properties:\s*$/);
      if (!propsMatch) {
        output.push(line);
        i++;
        continue;
      }

      const propsIndent = propsMatch[1].length;
      const childIndent = propsIndent + 2;
      output.push(line);
      i++;

      // Scan properties children for `style:`
      const propsLines = [];
      let styleLines = null;
      let styleStartIdx = -1;

      while (i < lines.length) {
        const childLine = lines[i];
        // Check if we've left the properties block
        const stripped = childLine.replace(/\s+$/, '');
        if (stripped === '') {
          propsLines.push(childLine);
          i++;
          continue;
        }
        const currentIndent = childLine.match(/^(\s*)/)[1].length;
        if (currentIndent <= propsIndent) break;

        // Check for `style:` at child indent level
        const styleMatch = childLine.match(new RegExp(`^(\\s{${childIndent}})style:(.*)`));
        if (styleMatch && currentIndent === childIndent) {
          styleStartIdx = propsLines.length;
          styleLines = [];
          const inlineValue = styleMatch[2].trim();

          if (inlineValue) {
            // Single-line: `style: { color: red }`
            styleLines.push(inlineValue);
          }
          i++;
          // Collect nested style lines
          while (i < lines.length) {
            const nested = lines[i];
            const nestedStripped = nested.replace(/\s+$/, '');
            if (nestedStripped === '') { i++; continue; }
            const nestedIndent = nested.match(/^(\s*)/)[1].length;
            if (nestedIndent <= childIndent) break;
            // Store with relative indent (remove properties+style indent)
            styleLines.push(nested.slice(childIndent + 2));
            i++;
          }
          changes.push('properties.style → style: { --element }');
        } else {
          propsLines.push(childLine);
          i++;
        }
      }

      // Output remaining properties lines
      for (const pl of propsLines) {
        output.push(pl);
      }

      // If we found style lines, add style: { --element } block
      if (styleLines && styleLines.length > 0) {
        const styleIndent = ' '.repeat(propsIndent);
        const elementIndent = ' '.repeat(propsIndent + 2);
        const valueIndent = ' '.repeat(propsIndent + 4);

        // Check if a `style:` block already exists nearby (look ahead)
        // For simplicity, always add a new style block after properties
        output.push(`${styleIndent}style:`);
        output.push(`${elementIndent}--element:`);
        for (const sl of styleLines) {
          output.push(`${valueIndent}${sl}`);
        }
      }
    }

    return { output: output.join('\n'), changes };
  },
});
