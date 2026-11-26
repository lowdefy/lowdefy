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

import { beforeEach, expect, test, vi } from 'vitest';

const mockStores = [];
const mockGetDataStore = vi.fn(async () => mockStores[0]);
vi.doMock('@lowdefy/test-utils/dataSets', async (importOriginal) => ({
  isDataStoreGone: (await importOriginal()).isDataStoreGone,
  getDataStore: mockGetDataStore,
}));

const { default: createJourneyHost } = await import('./createJourneyHost.js');

function createStore({ uri, ping }) {
  const store = {
    uri,
    client: { db: () => ({ command: ping }) },
    stop: vi.fn(async () => {
      mockStores.shift();
    }),
  };
  return store;
}

function gone() {
  const error = new Error('Server selection timed out');
  error.name = 'MongoServerSelectionError';
  return error;
}

beforeEach(() => {
  mockStores.splice(0);
  mockGetDataStore.mockClear();
});

test("createJourneyHost builds a page on the main thread's page builds and reads its _js through a handle to the build", async () => {
  const context = { jsMap: { client: {} } };
  const pageBuilds = {
    build: vi.fn(async () => ({ result: { built: true, warnings: [() => {}] }, built: context })),
    jsEntries: vi.fn(async () => 'export default {};'),
  };
  const host = createJourneyHost({ pageBuilds, storeThreads: new Set() });
  const built = await host.buildPage({ pageId: 'home' });
  // The result keeps only what a thread can be sent.
  expect(built).toEqual({ result: { built: true, installing: false }, built: 1 });
  expect(await host.pageJsEntries({ pageConfig: { id: 'page:home' }, built: 1 })).toBe(
    'export default {};'
  );
  expect(pageBuilds.jsEntries).toHaveBeenCalledWith({
    pageConfig: { id: 'page:home' },
    built: context,
  });
});

test('createJourneyHost answers a page no build context holds with no handle', async () => {
  const pageBuilds = {
    build: vi.fn(async () => ({ result: false, built: null })),
    jsEntries: vi.fn(async () => undefined),
  };
  const host = createJourneyHost({ pageBuilds, storeThreads: new Set() });
  expect(await host.buildPage({ pageId: 'missing' })).toEqual({ result: false, built: null });
  await host.pageJsEntries({ pageConfig: {}, built: null });
  expect(pageBuilds.jsEntries).toHaveBeenCalledWith({ pageConfig: {}, built: null });
});

test('createJourneyHost answers the URI of a store that responds, and records the thread', async () => {
  mockStores.push(createStore({ uri: 'mongodb://a', ping: async () => ({ ok: 1 }) }));
  const storeThreads = new Set();
  const host = createJourneyHost({ pageBuilds: {}, storeThreads });
  expect(await host.dataStoreUri({}, { threadId: 4 })).toBe('mongodb://a');
  expect(storeThreads.has(4)).toBe(true);
});

test("createJourneyHost stops a store whose mongod has gone and answers the fresh one's URI", async () => {
  const dead = createStore({
    uri: 'mongodb://dead',
    ping: async () => {
      throw gone();
    },
  });
  mockStores.push(dead, createStore({ uri: 'mongodb://fresh', ping: async () => ({ ok: 1 }) }));
  const host = createJourneyHost({ pageBuilds: {}, storeThreads: new Set() });
  expect(await host.dataStoreUri({}, { threadId: 4 })).toBe('mongodb://fresh');
  expect(dead.stop).toHaveBeenCalledTimes(1);
});

test('createJourneyHost stops the store a thread found gone only while it is still the current one', async () => {
  const current = createStore({ uri: 'mongodb://b', ping: async () => ({ ok: 1 }) });
  mockStores.push(current);
  const host = createJourneyHost({ pageBuilds: {}, storeThreads: new Set() });
  await host.dataStoreGone({ uri: 'mongodb://a' });
  expect(current.stop).not.toHaveBeenCalled();
  await host.dataStoreGone({ uri: 'mongodb://b' });
  expect(current.stop).toHaveBeenCalledTimes(1);
});
