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

import { describe, expect, test } from 'vitest';

import matchesShortcut from './matchesShortcut.js';
import parseShortcut from './parseShortcut.js';

const press = (key, flags = {}) => ({
  key,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...flags,
});

describe('matchesShortcut', () => {
  test('mod+enter is Cmd+Enter on a Mac', () => {
    const parsed = parseShortcut('mod+enter');
    expect(matchesShortcut(press('Enter', { metaKey: true }), parsed, true)).toBe(true);
    expect(matchesShortcut(press('Enter', { ctrlKey: true }), parsed, true)).toBe(false);
  });

  test('mod+enter is Ctrl+Enter elsewhere', () => {
    const parsed = parseShortcut('mod+enter');
    expect(matchesShortcut(press('Enter', { ctrlKey: true }), parsed, false)).toBe(true);
  });

  test('a plain Enter does not match mod+enter', () => {
    expect(matchesShortcut(press('Enter'), parseShortcut('mod+enter'), false)).toBe(false);
  });
});
