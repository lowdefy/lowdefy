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

import computeAggregate from './computeAggregate.js';

const amount = { key: 'amount', type: 'currency' };
const created = { key: 'created', type: 'date' };
const stage = { key: 'stage', type: 'status', options: [{ value: 'lead' }, { value: 'won' }] };

test('computeAggregate counts rows, empty and filled values', () => {
  const values = [1, null, '', 2, [], 0];
  expect(computeAggregate({ fn: 'count', values, column: amount })).toBe(6);
  expect(computeAggregate({ fn: 'countEmpty', values, column: amount })).toBe(3);
  expect(computeAggregate({ fn: 'countNotEmpty', values, column: amount })).toBe(3);
  expect(computeAggregate({ fn: 'percentEmpty', values, column: amount })).toBe(0.5);
});

test('computeAggregate counts distinct filled values, records by content', () => {
  expect(
    computeAggregate({ fn: 'countDistinct', values: ['a', 'b', 'a', null, { x: 1 }, { x: 1 }] })
  ).toBe(3);
});

test('computeAggregate sums and averages the numeric values only', () => {
  const values = [10, '5', null, 'n/a', 15];
  expect(computeAggregate({ fn: 'sum', values, column: amount })).toBe(30);
  expect(computeAggregate({ fn: 'avg', values, column: amount })).toBe(10);
});

test('computeAggregate returns 0 for the sum and null for the average of nothing', () => {
  expect(computeAggregate({ fn: 'sum', values: [], column: amount })).toBe(0);
  expect(computeAggregate({ fn: 'avg', values: [null], column: amount })).toBeNull();
  expect(computeAggregate({ fn: 'percentEmpty', values: [], column: amount })).toBeNull();
  expect(computeAggregate({ fn: 'count', values: undefined, column: amount })).toBe(0);
});

test('computeAggregate min and max of numbers', () => {
  const values = [3, '12', null, -4];
  expect(computeAggregate({ fn: 'min', values, column: amount })).toBe(-4);
  expect(computeAggregate({ fn: 'max', values, column: amount })).toBe(12);
  expect(computeAggregate({ fn: 'max', values: [], column: amount })).toBeNull();
});

test('computeAggregate min and max follow the column order for other types', () => {
  expect(computeAggregate({ fn: 'min', values: ['won', 'lead', null], column: stage })).toBe(
    'lead'
  );
  expect(computeAggregate({ fn: 'max', values: ['won', 'lead'], column: stage })).toBe('won');
  expect(computeAggregate({ fn: 'max', values: ['b', 'C', 'a'], column: { type: 'text' } })).toBe(
    'C'
  );
  expect(
    computeAggregate({ fn: 'min', values: ['2026-02-01', '2025-01-01'], column: created })
  ).toBe('2025-01-01');
});

test('computeAggregate earliest and latest return the original date values', () => {
  const values = ['2026-02-01', new Date('2026-03-01'), null, 'nope', '2025-06-30'];
  expect(computeAggregate({ fn: 'earliest', values, column: created })).toBe('2025-06-30');
  expect(computeAggregate({ fn: 'latest', values, column: created })).toEqual(
    new Date('2026-03-01')
  );
  expect(computeAggregate({ fn: 'latest', values: [null], column: created })).toBeNull();
});

test('computeAggregate throws on an unknown function', () => {
  expect(() => computeAggregate({ fn: 'median', values: [], column: amount })).toThrow(
    'Unknown table aggregate "median".'
  );
});

test('computeAggregate min and max handle more values than fit in a call stack', () => {
  const values = Array.from({ length: 300000 }, (_, i) => (i * 7919) % 300001);
  values[123456] = -5;
  values[234567] = 400000;
  const column = { type: 'number' };
  expect(computeAggregate({ fn: 'min', values, column })).toBe(-5);
  expect(computeAggregate({ fn: 'max', values, column })).toBe(400000);
});
