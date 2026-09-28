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

import applyTransactionToRows from './applyTransactionToRows.js';
import normalizeTransaction from './normalizeTransaction.js';

const getKey = (row) => row.id;

function apply(rows, transaction) {
  return applyTransactionToRows({ rows, transaction: normalizeTransaction(transaction), getKey });
}

test('applyTransactionToRows merges updates by key and keeps untouched rows', () => {
  const rows = [
    { id: 1, name: 'a', stage: 'lead' },
    { id: 2, name: 'b', stage: 'lead' },
  ];
  const result = apply(rows, { update: [{ id: 2, stage: 'won' }] });
  expect(result.rows[0]).toBe(rows[0]);
  expect(result.rows[1]).toEqual({ id: 2, name: 'b', stage: 'won' });
  expect(rows[1].stage).toBe('lead');
  expect(result.changed).toEqual({ added: 0, updated: 1, removed: 0 });
});

test('applyTransactionToRows removes rows given as rows or keys', () => {
  const rows = [{ id: 1 }, { id: 2 }, { id: '3' }];
  const result = apply(rows, { remove: [2, { id: '3' }] });
  expect(result.rows).toEqual([{ id: 1 }]);
  expect(result.changed.removed).toBe(2);
});

test('applyTransactionToRows appends added rows, or inserts them at addIndex', () => {
  const rows = [{ id: 1 }, { id: 2 }];
  expect(apply(rows, { add: [{ id: 3 }] }).rows.map(getKey)).toEqual([1, 2, 3]);
  expect(apply(rows, { add: [{ id: 3 }], addIndex: 0 }).rows.map(getKey)).toEqual([3, 1, 2]);
  expect(apply(rows, { add: [{ id: 3 }], addIndex: 99 }).rows.map(getKey)).toEqual([1, 2, 3]);
});

test('applyTransactionToRows ignores updates for keys that are not in the rows', () => {
  const rows = [{ id: 1 }];
  const result = apply(rows, { update: [{ id: 9, name: 'x' }] });
  expect(result.rows).toEqual([{ id: 1 }]);
  expect(result.changed.updated).toBe(0);
});

test('normalizeTransaction throws for lists that are not lists', () => {
  expect(() => normalizeTransaction({ add: {} })).toThrow('"add" must be a list');
  expect(() => normalizeTransaction(null)).toThrow('requires { add, update, remove }');
  expect(() => normalizeTransaction({ addIndex: 'x' })).toThrow('"addIndex" must be an integer');
});
