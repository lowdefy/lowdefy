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

const mockJoinDataStore = vi.fn();
vi.doMock('@lowdefy/test-utils/dataSets', () => ({ joinDataStore: mockJoinDataStore }));

const { default: createWorkerDataStore } = await import('./createWorkerDataStore.js');

function createCalls(uris) {
  const answers = [...uris];
  return { call: vi.fn(async (method) => (method === 'dataStoreUri' ? answers.shift() : null)) };
}

beforeEach(() => {
  mockJoinDataStore.mockReset();
  mockJoinDataStore.mockImplementation(async ({ uri }) => ({
    uri,
    client: { close: vi.fn(async () => {}) },
  }));
});

test('createWorkerDataStore joins the store once while the main thread answers the same URI', async () => {
  const calls = createCalls(['mongodb://a', 'mongodb://a']);
  const { getStore } = createWorkerDataStore({ calls });
  const first = await getStore();
  const second = await getStore();
  expect(second).toBe(first);
  expect(mockJoinDataStore).toHaveBeenCalledTimes(1);
});

test('createWorkerDataStore joins a new store when the main thread answers a new URI, and closes the old client', async () => {
  const calls = createCalls(['mongodb://a', 'mongodb://b']);
  const { getStore } = createWorkerDataStore({ calls });
  const first = await getStore();
  const second = await getStore();
  expect(second.uri).toBe('mongodb://b');
  await vi.waitFor(() => expect(first.client.close).toHaveBeenCalledTimes(1));
});

test('createWorkerDataStore tells the main thread when a session finds the store gone', async () => {
  const calls = createCalls(['mongodb://a']);
  const { getStore } = createWorkerDataStore({ calls });
  await getStore();
  await mockJoinDataStore.mock.calls[0][0].onGone();
  expect(calls.call).toHaveBeenCalledWith('dataStoreGone', { uri: 'mongodb://a' });
});

test('createWorkerDataStore joins again after a join that failed', async () => {
  const calls = createCalls(['mongodb://a', 'mongodb://a']);
  mockJoinDataStore.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
  const { getStore } = createWorkerDataStore({ calls });
  await expect(getStore()).rejects.toThrow('connect ECONNREFUSED');
  expect((await getStore()).uri).toBe('mongodb://a');
  expect(mockJoinDataStore).toHaveBeenCalledTimes(2);
});
