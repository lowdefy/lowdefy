#!/usr/bin/env node
// Migration: Move block-specific inline style properties to `style: { --* }` sub-slots.
// Category: A (deterministic)
// Affects: Card, Modal, Drawer, Tabs, ConfirmModal, Statistic, Descriptions, Tooltip
//
// Mapping:
//   Card:         headerStyle → style: { --header }, bodyStyle → style: { --body }
//   Modal:        bodyStyle → style: { --body }, maskStyle → style: { --mask }
//   Drawer:       drawerStyle → style: { --wrapper }, headerStyle → style: { --header },
//                 bodyStyle → style: { --body }, maskStyle → style: { --mask },
//                 contentWrapperStyle → style: { --content }
//   Tabs:         tabBarStyle → style: { --tabBar }
//   ConfirmModal: bodyStyle → style: { --body }
//   Statistic:    valueStyle → style: { --value }
//   Descriptions: contentStyle → style: { --content }, labelStyle → style: { --label }
//   Tooltip:      overlayStyle → style: { --inner }
//
// Usage:
//   node scripts/03-migrate-inline-style-props.mjs [--apply] [directory]

import { runMigration } from './_utils.mjs';

// Map of property names to their target styles sub-slot.
// These are block-agnostic — we rename them wherever they appear under `properties:`.
// This is safe because these property names are unique to their respective blocks.
const STYLE_PROP_MAP = {
  headerStyle: 'header',
  bodyStyle: 'body',
  maskStyle: 'mask',
  drawerStyle: 'wrapper',
  contentWrapperStyle: 'content',
  tabBarStyle: 'tabBar',
  valueStyle: 'value',
  contentStyle: 'content',
  labelStyle: 'label',
  overlayStyle: 'inner',
};

const PROP_NAMES = Object.keys(STYLE_PROP_MAP);
const PROP_PATTERN = new RegExp(`\\b(${PROP_NAMES.join('|')}):`);

runMigration({
  name: 'Move properties.*Style → style: { --* } sub-slots',
  transform(content) {
    if (!PROP_PATTERN.test(content)) {
      return { output: content, changes: [] };
    }

    const changes = [];
    // For each known style prop, do a regex replacement.
    // We match the prop under an indented properties block and report it.
    let output = content;

    for (const [oldProp, newSlot] of Object.entries(STYLE_PROP_MAP)) {
      // Match `    headerStyle:` (indented, under properties)
      const pattern = new RegExp(`^(\\s+)${oldProp}:`, 'gm');
      if (pattern.test(output)) {
        changes.push(`${oldProp} → style: { --${newSlot} }`);
        // Note: This simple regex rename flags for detection.
        // The actual move from properties to styles requires YAML-aware parsing.
        // For the codemod, we report the locations. The SKILL.md AI step handles the move.
      }
    }

    return { output, changes };
  },
  report(file, content) {
    const items = [];
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      for (const oldProp of PROP_NAMES) {
        if (line.match(new RegExp(`^\\s+${oldProp}:`))) {
          items.push(`Line ${i + 1}: ${oldProp} → style: { --${STYLE_PROP_MAP[oldProp]} } (move from properties to style block)`);
        }
      }
    });
    return items;
  },
});
