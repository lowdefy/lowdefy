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

import { journeyTargetSelectors } from '@lowdefy/helpers';
import { expect, test } from 'vitest';

import assignRowId from './assignRowId.js';

test('assignRowId keeps an id or _id the row gives', () => {
  expect(assignRowId({ data: { id: 'inv-0042', _id: 'other' } })).toBe('inv-0042');
  expect(assignRowId({ data: { _id: 7 } })).toBe(7);
});

test('assignRowId gives a row without an id a generated key that stays with the row', () => {
  const row = { name: 'a' };
  const first = assignRowId({ data: row });
  expect(first).toMatch(/^__row_\d+$/);
  expect(journeyTargetSelectors.isGeneratedRowKey(first)).toBe(true);
  expect(assignRowId({ data: row })).toBe(first);
  expect(Object.keys(row)).toEqual(['name']);
});

test('assignRowId gives each row without an id its own key', () => {
  const a = assignRowId({ data: { name: 'a' } });
  const b = assignRowId({ data: { name: 'a' } });
  expect(a).not.toBe(b);
});
