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

// The browser's crypto.randomUUID is not in the test environment.
jest.unstable_mockModule('../editing/generateRowKey.js', () => ({
  default: () => 'k1',
}));

const { default: createAddRow } = await import('./createAddRow.js');

// A table api with the pending new rows as plain state.
function createApi(triggerEvent) {
  const api = {
    properties: { rowKey: '_id' },
    methods: { triggerEvent: jest.fn(triggerEvent) },
    enrichment: { pending: [] },
  };
  api.enrichment.setPending = (update) => {
    api.enrichment.pending = update(api.enrichment.pending);
  };
  return api;
}

test('addNewRow shows the saving row while onRowAdd runs and removes it when it succeeds', async () => {
  let seen;
  const api = createApi(async () => {
    seen = api.enrichment.pending;
    return { success: true };
  });
  await expect(createAddRow(api)({ values: { name: 'Ada' } })).resolves.toBeNull();
  expect(seen).toHaveLength(1);
  expect(seen[0]).toMatchObject({ name: 'Ada', _id: 'new:k1' });
  expect(api.enrichment.pending).toEqual([]);
});

test('addNewRow removes the saving row and returns the message when onRowAdd fails', async () => {
  const api = createApi(async () => ({ success: false, error: { error: { message: 'Nope.' } } }));
  await expect(createAddRow(api)({ values: { name: 'Ada' } })).resolves.toBe('Nope.');
  expect(api.enrichment.pending).toEqual([]);
});

test('addNewRow removes the saving row and returns the message when triggerEvent rejects', async () => {
  const api = createApi(async () => {
    throw new Error('The event runner failed.');
  });
  await expect(createAddRow(api)({ values: { name: 'Ada' } })).resolves.toBe(
    'The event runner failed.'
  );
  expect(api.enrichment.pending).toEqual([]);
});
