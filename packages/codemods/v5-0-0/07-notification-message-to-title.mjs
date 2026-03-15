#!/usr/bin/env node
// Migration: Notification `message` → `title` (context-aware).
// Category: A (deterministic)
// Affects: Notification blocks only
//
// This script is context-aware: it only renames `message` to `title` when
// it appears under `properties:` in a block with `type: Notification`.
// The `message` key is too common to rename globally.
//
// Usage:
//   node scripts/07-notification-message-to-title.mjs [--apply] [directory]

import { runMigration, findCodeBlockLines } from './_utils.mjs';

runMigration({
  name: 'Notification message → title',
  transform(content) {
    const changes = [];
    const lines = content.split('\n');
    const codeBlockLines = findCodeBlockLines(content);
    const output = [];
    let inNotificationBlock = false;
    let inProperties = false;
    let blockIndent = -1;
    let propsIndent = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (codeBlockLines.has(i)) { output.push(line); continue; }
      const stripped = line.trimStart();
      const indent = line.length - stripped.length;

      // Detect `type: Notification`
      if (stripped.match(/^type:\s*Notification\s*$/)) {
        inNotificationBlock = true;
        // Find the block indent (type: is a child of the block)
        blockIndent = indent - 2; // approximate
        output.push(line);
        continue;
      }

      // If in a Notification block, detect properties:
      if (inNotificationBlock && stripped.match(/^properties:\s*$/)) {
        inProperties = true;
        propsIndent = indent;
        output.push(line);
        continue;
      }

      // If in properties of Notification, look for message:
      if (inNotificationBlock && inProperties) {
        if (indent <= propsIndent && stripped !== '') {
          inProperties = false;
          // Also check if we've left the block entirely
          if (indent <= blockIndent && stripped !== '') {
            inNotificationBlock = false;
          }
        } else if (indent === propsIndent + 2 && stripped.match(/^message:/)) {
          changes.push(`Line ${i + 1}: message → title (Notification)`);
          output.push(line.replace(/^(\s+)message:/, '$1title:'));
          continue;
        }
      }

      // Reset block tracking on new blocks
      if (stripped.match(/^-\s+id:/) && indent <= blockIndent) {
        inNotificationBlock = false;
        inProperties = false;
      }

      output.push(line);
    }

    return { output: output.join('\n'), changes };
  },
});
