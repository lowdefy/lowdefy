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

test('applyTransactionToRows shallow merge replaces a nested object by default', () => {
  const rows = [{ id: 1, _enrich: { email: { status: 'ok' }, phone: { status: 'ok' } } }];
  const result = apply(rows, { update: [{ id: 1, _enrich: { email: { status: 'running' } } }] });
  expect(result.rows[0]._enrich).toEqual({ email: { status: 'running' } });
});

test('applyTransactionToRows deep merge keeps the other nested fields of a partial update', () => {
  const phone = { status: 'ok', value: '555' };
  const rows = [
    { id: 1, name: 'a', _enrich: { email: { status: 'queued', raw: { a: 1 } }, phone } },
    { id: 2, name: 'b' },
  ];
  const result = apply(rows, {
    merge: 'deep',
    update: [{ id: 1, _enrich: { email: { status: 'ok', value: 'a@x.io', raw: { b: [1] } } } }],
  });
  expect(result.rows[0]).toEqual({
    id: 1,
    name: 'a',
    _enrich: {
      email: { status: 'ok', value: 'a@x.io', raw: { a: 1, b: [1] } },
      phone: { status: 'ok', value: '555' },
    },
  });
  expect(result.rows[0]._enrich.phone).toBe(phone);
  expect(result.rows[1]).toBe(rows[1]);
  expect(rows[0]._enrich.email.status).toBe('queued');
});

test('applyTransactionToRows deep merge replaces arrays and dates, and creates missing objects', () => {
  const date = new Date('2026-01-01T00:00:00.000Z');
  const rows = [{ id: 1, tags: ['a', 'b'] }];
  const result = apply(rows, {
    merge: 'deep',
    update: [{ id: 1, tags: ['c'], _enrich: { email: { finishedAt: date } } }],
  });
  expect(result.rows[0]).toEqual({ id: 1, tags: ['c'], _enrich: { email: { finishedAt: date } } });
  expect(result.rows[0]._enrich.email.finishedAt).toBe(date);
});

test('applyTransactionToRows shallow merge of a full document drops the cell keys the server removed', () => {
  // A MongoDB change stream's fullDocument after a rerun found nothing: value, raw and
  // inputHash were unset, so they are gone from the pushed _enrich.
  const rows = [
    {
      id: 1,
      name: 'a',
      _enrich: {
        company: { status: 'ok', value: 'Software', raw: { employees: 1200 }, inputHash: 'h1' },
        email: { status: 'ok', value: 'a@x.io' },
      },
    },
  ];
  const result = apply(rows, {
    update: [
      {
        id: 1,
        _enrich: { company: { status: 'empty' }, email: { status: 'ok', value: 'a@x.io' } },
      },
    ],
  });
  expect(result.rows[0]).toEqual({
    id: 1,
    name: 'a',
    _enrich: { company: { status: 'empty' }, email: { status: 'ok', value: 'a@x.io' } },
  });
});

test('applyTransactionToRows deep merge never removes a key the patch leaves out', () => {
  const rows = [{ id: 1, _enrich: { company: { status: 'ok', value: 'Software' } } }];
  const result = apply(rows, {
    merge: 'deep',
    update: [{ id: 1, _enrich: { company: { status: 'empty' } } }],
  });
  expect(result.rows[0]._enrich.company).toEqual({ status: 'empty', value: 'Software' });
});

test('normalizeTransaction rejects an unknown merge', () => {
  expect(() => normalizeTransaction({ update: [], merge: 'path' })).toThrow(
    'applyTransaction "merge" must be "shallow" or "deep". Received "path".'
  );
});
