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

import createComparator from './createComparator.js';
import normalizeColumns from './normalizeColumns.js';

function column(config) {
  return normalizeColumns({ columns: [{ key: 'x', ...config }] }).columns[0];
}

function sortValues(values, config, desc) {
  return [...values].sort(createComparator({ column: column(config), desc }));
}

test('createComparator sorts numbers numerically, not as text', () => {
  expect(sortValues([10, 9, 100, '2'], { type: 'number' })).toEqual(['2', 9, 10, 100]);
  expect(sortValues([10, 9, 100], { type: 'currency' }, true)).toEqual([100, 10, 9]);
});

test('createComparator sorts text with numeric awareness and without case', () => {
  expect(sortValues(['item 10', 'Item 2', 'item 1'], {})).toEqual(['item 1', 'Item 2', 'item 10']);
  expect(sortValues(['b', 'A', 'c'], {}, true)).toEqual(['c', 'b', 'A']);
  expect(sortValues(['é', 'e', 'f'], {})[2]).toBe('f');
});

test('createComparator keeps empty values last in both directions', () => {
  const values = [3, null, 1, undefined, '', 2, 'n/a'];
  expect(sortValues(values, { type: 'number' }).slice(0, 3)).toEqual([1, 2, 3]);
  expect(sortValues(values, { type: 'number' }, true).slice(0, 3)).toEqual([3, 2, 1]);
  expect(sortValues(['b', null, 'a'], {}, true)).toEqual(['b', 'a', null]);
  expect(sortValues([[], ['a']], { type: 'tags' })).toEqual([['a'], []]);
});

test('createComparator sorts dates by time', () => {
  expect(
    sortValues(['2026-03-01', '2025-12-31', new Date('2026-01-15'), 'not a date'], { type: 'date' })
  ).toEqual(['2025-12-31', new Date('2026-01-15'), '2026-03-01', 'not a date']);
});

test('createComparator sorts false before true', () => {
  expect(sortValues([true, false, null, true], { type: 'boolean' })).toEqual([
    false,
    true,
    true,
    null,
  ]);
});

test('createComparator sorts enums by option order, unknown values after', () => {
  const config = { type: 'status', options: ['lead', 'qualified', 'won'] };
  expect(sortValues(['won', 'zeta', 'lead', 'alpha', 'qualified'], config)).toEqual([
    'lead',
    'qualified',
    'won',
    'alpha',
    'zeta',
  ]);
  expect(sortValues(['won', 'lead', 'qualified'], config, true)).toEqual([
    'won',
    'qualified',
    'lead',
  ]);
});

test('createComparator sorts tags by their joined option labels', () => {
  const config = {
    type: 'tags',
    options: [
      { value: 'b', label: 'Alpha' },
      { value: 'a', label: 'Beta' },
    ],
  };
  expect(sortValues([['a'], ['b']], config)).toEqual([['b'], ['a']]);
});

test('createComparator sorts records by their label', () => {
  expect(sortValues([{ name: 'Zed' }, { name: 'amy' }], { type: 'relation' })).toEqual([
    { name: 'amy' },
    { name: 'Zed' },
  ]);
});

test('createComparator keeps action columns in their order', () => {
  expect(sortValues(['b', 'a'], { type: 'buttons' })).toEqual(['b', 'a']);
});

test('createComparator throws on an unknown type', () => {
  expect(() => createComparator({ column: { type: 'txt' } })).toThrow(
    'Unknown table cell type "txt".'
  );
});
