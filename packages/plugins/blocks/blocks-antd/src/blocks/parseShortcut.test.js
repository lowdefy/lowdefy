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

import parseShortcut from './parseShortcut.js';

describe('parseShortcut', () => {
  test('reads modifiers and the key', () => {
    expect(parseShortcut('Mod+Shift+K')).toEqual({
      mod: true,
      ctrl: false,
      shift: true,
      alt: false,
      key: 'k',
    });
  });

  test('reads a single key', () => {
    expect(parseShortcut('1')).toEqual({
      mod: false,
      ctrl: false,
      shift: false,
      alt: false,
      key: '1',
    });
  });

  test('is null with no shortcut', () => {
    expect(parseShortcut(undefined)).toBeNull();
    expect(parseShortcut('')).toBeNull();
  });
});
