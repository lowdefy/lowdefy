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

import { validate } from '@lowdefy/ajv';

import compileEnrichmentComplete from './compileEnrichmentComplete.js';
import planCompleteCell from './planCompleteCell.js';
import schema from './schema.js';

// The per-cell cost of a result (micro-USD), as a treg-backed provider reports it.

const now = new Date('2026-09-29T10:00:00.000Z');
const token = `${'b'.repeat(24)}:${'0123456789abcd'}`;
const columnDefs = [
  { key: 'domain' },
  { key: 'email', kind: 'enrichment', provider: 'finder', inputs: { d: { column: 'domain' } } },
];

function parse(overrides) {
  return compileEnrichmentComplete({
    properties: {
      columnDefs,
      filter: {},
      results: [
        { rowKey: 'r1', columnKey: 'email', claimToken: token, status: 'ok', ...overrides },
      ],
    },
  });
}

function plan(overrides, attempts = 1) {
  const compiled = parse(overrides);
  return planCompleteCell({
    result: compiled.results[0],
    doc: { _id: 'id1', _enrich: { email: { attempts } } },
    compiled,
    now,
  });
}

test('MongoDBEnrichmentComplete stores the cost of an ok result on the cell', () => {
  const cell = plan({ value: 'a@b', cost: 4000 });
  expect(cell.kind).toBe('ok');
  expect(cell.operation.updateOne.update.$set['_enrich.email.cost']).toBe(4000);
  expect(cell.operation.updateOne.update.$unset['_enrich.email.cost']).toBeUndefined();
});

test('MongoDBEnrichmentComplete stores a zero cost, such as an idempotent replay', () => {
  expect(plan({ status: 'empty', cost: 0 }).operation.updateOne.update.$set).toMatchObject({
    '_enrich.email.cost': 0,
  });
});

test('MongoDBEnrichmentComplete stores the cost of a requeued and of a final error', () => {
  const requeue = plan({ status: 'error', error: 'busy', cost: 10 });
  expect(requeue.kind).toBe('requeue');
  expect(requeue.operation.updateOne.update.$set['_enrich.email.cost']).toBe(10);
  const final = plan({ status: 'error', error: 'bad', retry: false, cost: 20 });
  expect(final.kind).toBe('error');
  expect(final.operation.updateOne.update.$set['_enrich.email.cost']).toBe(20);
});

test('MongoDBEnrichmentComplete leaves the cell cost alone when a result has none', () => {
  [plan({ value: 'a@b' }), plan({ value: 'a@b', cost: null }), plan({ status: 'error' })].forEach(
    (cell) => {
      expect(cell.operation.updateOne.update.$set['_enrich.email.cost']).toBeUndefined();
      expect(cell.operation.updateOne.update.$unset['_enrich.email.cost']).toBeUndefined();
    }
  );
});

test('MongoDBEnrichmentComplete refuses a cost that is not a whole number of micro-USD', () => {
  [0.5, -1, '4000'].forEach((cost) => {
    expect(() => parse({ cost })).toThrow(
      'MongoDBEnrichmentComplete "results" item 0 "cost" should be a whole number of micro-USD, 0 or more.'
    );
  });
});

test('MongoDBEnrichmentComplete schema accepts a cost on a result', () => {
  const result = { rowKey: 'r1', columnKey: 'email', claimToken: token, status: 'ok' };
  expect(validate({ schema, data: { columnDefs, results: [{ ...result, cost: 4000 }] } })).toEqual({
    valid: true,
  });
  expect(validate({ schema, data: { columnDefs, results: [{ ...result, cost: null }] } })).toEqual({
    valid: true,
  });
  expect(() =>
    validate({ schema, data: { columnDefs, results: [{ ...result, cost: -1 }] } })
  ).toThrow();
});
