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

import normalizeViewMenu from './normalizeViewMenu.js';
import { expect, test } from 'vitest';

test('normalizeViewMenu keeps items with a unique string key and defaults label, danger and confirm', () => {
  expect(normalizeViewMenu(null)).toBe(null);
  expect(
    normalizeViewMenu([
      { key: 'a' },
      { key: 'a', label: 'Again' },
      { label: 'No key' },
      'text',
      { key: 'b', confirm: true, danger: 'yes' },
    ])
  ).toEqual([
    { key: 'a', label: 'a', danger: false, confirm: false },
    { key: 'b', label: 'b', danger: false, confirm: true },
  ]);
  expect(normalizeViewMenu([])).toEqual([]);
});
