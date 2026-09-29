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

import createSearchMatcher from './createSearchMatcher.js';
import getSearchColumns from './getSearchColumns.js';

const name = { key: 'name', field: 'name', type: 'text', cell: {} };
const amount = { key: 'amount', field: 'amount', type: 'number', cell: {} };
const stage = {
  key: 'stage',
  field: 'stage',
  type: 'tag',
  cell: {},
  options: [{ value: 'won', label: 'Won' }],
};
const actions = { key: 'actions', field: 'actions', type: 'buttons', cell: {} };

test('createSearchMatcher matches every word case-insensitively across the columns', () => {
  const matches = createSearchMatcher({ search: '  ACME   won ', columns: [name, stage] });
  expect(matches({ name: 'Acme deal', stage: 'won' })).toBe(true);
  expect(matches({ name: 'Acme deal', stage: 'lost' })).toBe(false);
  expect(matches({ name: 'Globex', stage: 'won' })).toBe(false);
});

test('createSearchMatcher reads display text, not raw values', () => {
  // The number as its cell shows it in this locale ("1,234,567", "1 234 567", ...).
  const shown = new Intl.NumberFormat().format(1234567);
  const row = { amount: 1234567 };
  expect(createSearchMatcher({ search: shown, columns: [amount] })(row)).toBe(true);
  expect(createSearchMatcher({ search: '1234567', columns: [amount] })(row)).toBe(
    shown === '1234567'
  );
  expect(createSearchMatcher({ search: 'won', columns: [stage] })({ stage: 'won' })).toBe(true);
});

test('createSearchMatcher returns null for an empty search or no columns', () => {
  expect(createSearchMatcher({ search: null, columns: [name] })).toBe(null);
  expect(createSearchMatcher({ search: '   ', columns: [name] })).toBe(null);
  expect(createSearchMatcher({ search: 'a', columns: [] })).toBe(null);
});

test('createSearchMatcher does not match a word across two columns', () => {
  const matches = createSearchMatcher({ search: 'dealwon', columns: [name, stage] });
  expect(matches({ name: 'Acme deal', stage: 'won' })).toBe(false);
});

test('getSearchColumns searches the visible data columns', () => {
  expect(
    getSearchColumns({ columns: [name, amount, actions], columnVisibility: { amount: false } })
  ).toEqual([name]);
});

test('getSearchColumns searches only searchable columns when any declare it', () => {
  const searchable = { ...amount, searchable: true };
  expect(getSearchColumns({ columns: [name, searchable], columnVisibility: {} })).toEqual([
    searchable,
  ]);
});
