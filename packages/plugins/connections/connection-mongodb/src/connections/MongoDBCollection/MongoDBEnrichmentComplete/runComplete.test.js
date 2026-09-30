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
import { jest } from '@jest/globals';

import compileEnrichmentComplete from './compileEnrichmentComplete.js';
import runComplete from './runComplete.js';

const tokenA = `${'a'.repeat(24)}:0123456789abcd`;
const tokenB = `${'b'.repeat(24)}:0123456789abcd`;

const columnDefs = [
  { key: 'domain' },
  { key: 'email', kind: 'enrichment', provider: 'finder', inputs: { d: { column: 'domain' } } },
];

function fakeCollection({ before, bulkResult, after }) {
  const reads = [before, after];
  return {
    find: jest.fn(() => ({ toArray: async () => reads.shift() })),
    bulkWrite: jest.fn(async () => bulkResult),
  };
}

test('runComplete reads back which cells it wrote when a claim moved on between read and write', async () => {
  const compiled = compileEnrichmentComplete({
    properties: {
      columnDefs,
      filter: {},
      results: [
        { rowKey: 'r1', columnKey: 'email', claimToken: tokenA, status: 'ok', value: 'one' },
        { rowKey: 'r2', columnKey: 'email', claimToken: tokenB, status: 'ok', value: 'two' },
      ],
    },
  });
  const collection = fakeCollection({
    before: [
      { _id: 'r1', _enrich: { email: { claimToken: tokenA, status: 'running', attempts: 1 } } },
      { _id: 'r2', _enrich: { email: { claimToken: tokenB, status: 'running', attempts: 1 } } },
    ],
    bulkResult: { matchedCount: 1, modifiedCount: 1 },
    after: [
      { _id: 'r1', _enrich: { email: { claimToken: tokenA, status: 'ok' } } },
      { _id: 'r2', _enrich: { email: { claimToken: 'c'.repeat(24), status: 'running' } } },
    ],
  });
  const run = await runComplete({ collection, compiled, now: new Date() });
  expect(run.response).toEqual({
    applied: 1,
    ignored: 1,
    requeued: 0,
    released: 0,
    downstream: [],
  });
  // No column waits for email, so there is nothing to release.
  expect(collection.bulkWrite).toHaveBeenCalledTimes(1);
  expect(collection.find).toHaveBeenCalledTimes(2);
});

test('runComplete writes nothing for results whose claim no row holds', async () => {
  const compiled = compileEnrichmentComplete({
    properties: {
      columnDefs,
      filter: {},
      results: [{ rowKey: 'r1', columnKey: 'email', claimToken: tokenA, status: 'ok' }],
    },
  });
  const collection = fakeCollection({
    before: [{ _id: 'r1', _enrich: { email: { claimToken: tokenB, status: 'running' } } }],
    bulkResult: { matchedCount: 0, modifiedCount: 0 },
    after: [],
  });
  const run = await runComplete({ collection, compiled, now: new Date() });
  expect(run.response).toMatchObject({ applied: 0, ignored: 1 });
  expect(collection.bulkWrite).not.toHaveBeenCalled();
});
