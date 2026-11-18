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

import { expect, test, vi } from 'vitest';

const waitForRunStoreRecord = vi.fn();
vi.doMock('./waitForRunStoreRecord.js', () => ({ default: waitForRunStoreRecord }));
const removeRunStoreRecord = vi.fn();
vi.doMock('./removeRunStoreRecord.js', () => ({ default: removeRunStoreRecord }));
vi.doMock('./announceDataStoreDownload.js', () => ({ default: async () => false }));
vi.doMock('./getRunOwnerPid.js', () => ({ default: () => 9 }));
vi.doMock('./getRunStoreRecordPath.js', () => ({ default: () => '/tmp/data-store-9.json' }));
const connect = vi.fn();
vi.doMock('mongodb', () => ({
  MongoClient: vi.fn(function (uri) {
    return { uri, connect: () => connect(uri), close: vi.fn(async () => {}) };
  }),
}));

const { default: getRunDataStore } = await import('./getRunDataStore.js');

// Joining with a real keeper and mongod is in getRunDataStore.mongodb.test.js; these are the
// joins that find a record whose store does not answer.

const logger = { info: vi.fn(), warn: vi.fn() };

function storeGone() {
  return Object.assign(new Error('Server selection timed out'), {
    name: 'MongoServerSelectionError',
  });
}

function record(n) {
  return { keeperPid: 100 + n, token: `t${n}`, uri: `mongodb://127.0.0.1:${50000 + n}/` };
}

test('getRunDataStore replaces a record whose store does not answer and joins the next one', async () => {
  waitForRunStoreRecord.mockResolvedValueOnce(record(1)).mockResolvedValueOnce(record(2));
  connect.mockRejectedValueOnce(storeGone()).mockResolvedValueOnce(undefined);
  const store = await getRunDataStore({ logger });
  expect(store.uri).toEqual(record(2).uri);
  expect(store.keeperPid).toEqual(102);
  expect(removeRunStoreRecord).toHaveBeenCalledTimes(1);
  expect(removeRunStoreRecord).toHaveBeenCalledWith({
    recordPath: '/tmp/data-store-9.json',
    token: 't1',
  });
});

test('getRunDataStore throws once three stores in a row do not answer', async () => {
  waitForRunStoreRecord
    .mockResolvedValueOnce(record(1))
    .mockResolvedValueOnce(record(2))
    .mockResolvedValueOnce(record(3));
  connect.mockRejectedValue(storeGone());
  await expect(getRunDataStore({ logger })).rejects.toThrow('Server selection timed out');
  expect(waitForRunStoreRecord).toHaveBeenCalledTimes(3);
  // The third record is left for the next join to find dead again.
  expect(removeRunStoreRecord).toHaveBeenCalledTimes(2);
});

test('getRunDataStore throws an error that does not say the store is gone, without removing the record', async () => {
  waitForRunStoreRecord.mockResolvedValueOnce(record(1));
  connect.mockRejectedValueOnce(new Error('Invalid URI'));
  await expect(getRunDataStore({ logger })).rejects.toThrow('Invalid URI');
  expect(removeRunStoreRecord).not.toHaveBeenCalled();
});
