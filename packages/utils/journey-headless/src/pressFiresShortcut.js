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

import { normalizeShortcut } from '@lowdefy/client/createShortcutManager.js';
import { matchKeybindingPress, parseKeybinding } from 'tinykeys';

// Playwright's US layout for the keys whose KeyboardEvent.key and .code differ, each name
// (as a journey may write it) to [key, code]. Letters and digits follow a rule below; any
// other name (Enter, Escape, Tab, ArrowUp, F2) is its own key and code.
const US_KEYS = [
  [' ', 'Space'],
  ['-', 'Minus'],
  ['=', 'Equal'],
  ['[', 'BracketLeft'],
  [']', 'BracketRight'],
  ['\\', 'Backslash'],
  [';', 'Semicolon'],
  ["'", 'Quote'],
  ['`', 'Backquote'],
  [',', 'Comma'],
  ['.', 'Period'],
  ['/', 'Slash'],
];
const BY_NAME = new Map(
  US_KEYS.flatMap(([key, code]) => [
    [key, [key, code]],
    [code, [key, code]],
  ])
);

// The KeyboardEvent key and code Playwright sends for a key name.
function keyAndCode(name) {
  if (BY_NAME.has(name)) return BY_NAME.get(name);
  if (/^[a-z]$/i.test(name)) return [name, `Key${name.toUpperCase()}`];
  if (/^Key[A-Z]$/.test(name)) return [name.slice(3).toLowerCase(), name];
  if (/^[0-9]$/.test(name)) return [name, `Digit${name}`];
  if (/^Digit[0-9]$/.test(name)) return [name.slice(5), name];
  return [name, name];
}

// Playwright's modifier names, as the KeyboardEvent modifier each holds down.
const MODIFIERS = { Shift: 'Shift', Control: 'Control', Alt: 'Alt', Meta: 'Meta' };

// The keydown a press of `key` (a Playwright chord, `Mod` already resolved) sends, as far as
// tinykeys reads it. A chord whose key is `+` ends in an empty part.
function pressedEvent({ key, modifier }) {
  const parts = key.split('+');
  const plusKey = parts.at(-1) === '' && parts.length > 1;
  const name = plusKey ? '+' : parts.at(-1);
  const held = new Set(
    parts
      .slice(0, plusKey ? -2 : -1)
      .map((part) => (part === 'ControlOrMeta' ? modifier : (MODIFIERS[part] ?? part)))
  );
  const [eventKey, code] = keyAndCode(name);
  return { key: eventKey, code, getModifierState: (mod) => held.has(mod) };
}

// Whether pressing `key` fires a block event bound with this `shortcut`, decided by tinykeys
// itself on the shortcut the client binds (createShortcutManager's normalizeShortcut): the
// binding's key matches the event's key (case ignored) or code, or its `(regex)` matches either;
// its required modifiers are held and no others but its `[optional]` ones. `$mod` is `modifier`,
// the page's platform modifier (the browser runner's getShortcutModifier), since tinykeys in Node
// reads no platform.
// A sequence (`g i`) fires on the press of its last chord, so that chord is matched: a press of
// it alone refuses too much, never too little.
function pressFiresShortcut({ key, shortcut, modifier }) {
  const bound = normalizeShortcut(shortcut.trim()).replaceAll('$mod', modifier);
  const last = parseKeybinding(bound).at(-1);
  return matchKeybindingPress(pressedEvent({ key, modifier }), last);
}

export default pressFiresShortcut;
