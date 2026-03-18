/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { tinykeys } from 'tinykeys';

const SPECIAL_KEYS = new Set([
  'Escape',
  'Enter',
  'Backspace',
  'Delete',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Tab',
  'Space',
]);

const MODIFIER_MAP = {
  mod: '$mod',
  alt: 'Alt',
  shift: 'Shift',
  ctrl: 'Control',
};

const MODIFIER_VALUES = new Set(['$mod', 'Alt', 'Shift', 'Control']);

function normalizeShortcut(shortcut) {
  // Sequences are space-separated parts like "g i"
  if (shortcut.includes(' ') && !shortcut.includes('+')) {
    return shortcut
      .split(' ')
      .map((part) => normalizePart(part))
      .join(' ');
  }
  // Check for sequences that have modifiers: "mod+G mod+I" is invalid in tinykeys,
  // but "g i" (no modifiers) is a sequence. Handle mixed case: split on space.
  if (shortcut.includes(' ')) {
    return shortcut
      .split(' ')
      .map((part) => normalizePart(part))
      .join(' ');
  }
  return normalizePart(shortcut);
}

function normalizePart(part) {
  const segments = part.split('+');
  if (segments.length === 1) {
    // Single key, no modifiers
    return normalizeKey(segments[0]);
  }
  const key = segments[segments.length - 1];
  const modifiers = segments.slice(0, -1);
  const normalizedModifiers = modifiers.map((mod) => MODIFIER_MAP[mod.toLowerCase()] || mod);
  return [...normalizedModifiers, normalizeKey(key)].join('+');
}

function normalizeKey(key) {
  if (SPECIAL_KEYS.has(key)) return key;
  if (key.length === 1) return key.toLowerCase();
  return key;
}

function hasModifier(normalizedShortcut) {
  // Check the first part (for sequences, only first part matters for suppression)
  const firstPart = normalizedShortcut.split(' ')[0];
  return firstPart.split('+').some((segment) => MODIFIER_VALUES.has(segment));
}

function collectShortcuts(context) {
  const entries = [];
  const blockMap = context._internal.RootSlots.map;
  Object.values(blockMap).forEach((block) => {
    if (!block.Events || !block.Events.events) return;
    Object.entries(block.Events.events).forEach(([eventName, event]) => {
      if (!event.shortcut) return;
      const shortcuts = Array.isArray(event.shortcut) ? event.shortcut : [event.shortcut];
      shortcuts.forEach((s) => entries.push({ block, eventName, shortcut: s }));
    });
  });
  return entries;
}

function createShortcutManager() {
  let unsubscribe = null;

  function init(context) {
    const entries = collectShortcuts(context);
    if (entries.length === 0) return;

    const shortcutMap = {};
    // Last entry wins for duplicates
    entries.forEach(({ block, eventName, shortcut }) => {
      const normalized = normalizeShortcut(shortcut);
      const modded = hasModifier(normalized);
      shortcutMap[normalized] = (event) => {
        // Visibility gating
        if (block.visibleEval && block.visibleEval.output === false) return;
        // Input field suppression for non-modifier shortcuts
        if (!modded) {
          const tag = event.target?.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) {
            return;
          }
        }
        event.preventDefault();
        block.triggerEvent({ name: eventName });
      };
    });

    const win = context._internal.lowdefy._internal.globals.window;
    unsubscribe = tinykeys(win, shortcutMap);
  }

  function destroy() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  return { init, destroy };
}

export default createShortcutManager;
