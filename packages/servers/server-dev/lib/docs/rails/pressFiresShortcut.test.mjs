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

import { expect, test } from 'vitest';

import pressFiresShortcut from './pressFiresShortcut.js';

test.each([
  ['Meta+s', 'mod+s', 'Meta'],
  ['Control+s', 'mod+s', 'Control'],
  ['Meta+K', 'mod+k', 'Meta'],
  ['Control+s', 'ctrl+s', 'Meta'],
  ['Enter', 'Enter', 'Meta'],
  ['/', '/', 'Control'],
  ['Alt+Shift+n', 'shift+alt+N', 'Control'],
  ['Meta+Backspace', 'mod+Backspace', 'Meta'],
  ['i', 'g i', 'Control'],
  ['Control++', 'ctrl++', 'Meta'],
  ['ControlOrMeta+s', 'mod+s', 'Meta'],
])('pressing %s fires the shortcut %s (platform modifier %s)', (key, shortcut, modifier) => {
  expect(pressFiresShortcut({ key, shortcut, modifier })).toBe(true);
});

test.each([
  ['Control+s', 'mod+s', 'Meta'],
  ['s', 'mod+s', 'Meta'],
  ['Meta+Shift+s', 'mod+s', 'Meta'],
  ['Meta+j', 'mod+k', 'Meta'],
  ['g', 'g i', 'Control'],
  ['Enter', 'Escape', 'Meta'],
])(
  'pressing %s does not fire the shortcut %s (platform modifier %s)',
  (key, shortcut, modifier) => {
    expect(pressFiresShortcut({ key, shortcut, modifier })).toBe(false);
  }
);
