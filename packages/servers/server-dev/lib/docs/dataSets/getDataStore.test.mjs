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

const create = jest.fn();
const connect = jest.fn();

jest.unstable_mockModule('mongodb-memory-server-core', () => ({
  MongoMemoryReplSet: { create },
}));
jest.unstable_mockModule('mongodb-memory-server-core/lib/util/DryMongoBinary.js', () => ({
  DryMongoBinary: {
    generateOptions: jest.fn(async () => ({ version: '6.0.14' })),
    locateBinary: jest.fn(async () => '/cache/mongod'),
  },
}));
jest.unstable_mockModule('mongodb', () => ({
  MongoClient: jest.fn(() => ({ connect, close: jest.fn() })),
}));

const { default: getDataStore } = await import('./getDataStore.js');

afterEach(() => {
  delete globalThis[Symbol.for('lowdefy.devServer.dataStore')];
});

test('getDataStore starts one replica set and returns the same store on every call', async () => {
  create.mockResolvedValue({
    getUri: () => 'mongodb://127.0.0.1:1/?replicaSet=x',
    stop: jest.fn(),
  });
  const first = await getDataStore();
  const second = await getDataStore();
  expect(first).toBe(second);
  expect(first.uri).toEqual('mongodb://127.0.0.1:1/?replicaSet=x');
  expect(create).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledWith({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
});

test('getDataStore clears a failed start so the next call retries', async () => {
  create.mockRejectedValueOnce(new Error('no mongod'));
  await expect(getDataStore()).rejects.toThrow('no mongod');
  create.mockResolvedValueOnce({ getUri: () => 'mongodb://127.0.0.1:2/', stop: jest.fn() });
  const store = await getDataStore();
  expect(store.uri).toEqual('mongodb://127.0.0.1:2/');
});
