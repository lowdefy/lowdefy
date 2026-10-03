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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';

const create = jest.fn();
const connect = jest.fn();
const listDatabases = jest.fn();

jest.unstable_mockModule('mongodb-memory-server-core', () => ({
  MongoMemoryReplSet: { create },
}));
jest.unstable_mockModule('mongodb-memory-server-core/lib/util/DryMongoBinary.js', () => ({
  DryMongoBinary: {
    generateOptions: jest.fn(async () => ({ version: '6.0.14' })),
    locateBinary: jest.fn(async () => '/cache/mongod'),
  },
}));
const actualMongodb = await import('mongodb');
jest.unstable_mockModule('mongodb', () => ({
  BSON: actualMongodb.BSON,
  ObjectId: actualMongodb.ObjectId,
  MongoClient: jest.fn(() => ({
    connect,
    close: jest.fn(async () => {}),
    db: () => ({ admin: () => ({ listDatabases }), dropDatabase: async () => {} }),
  })),
}));

const { default: getDataStore } = await import('./getDataStore.js');
const { default: openDataSession } = await import('./openDataSession.js');
const { MIN_PORT } = await import('./pickDataStorePort.js');

function createReplSet({ uri = 'mongodb://127.0.0.1:50001/?replicaSet=x', instanceInfo } = {}) {
  return {
    getUri: () => uri,
    stop: jest.fn(async () => true),
    servers: [{ instanceInfo }],
  };
}

// The listeners a started store added for a process event, so a test runs the store's own handler
// without signalling the test process.
function addedListeners(event, before) {
  return process.listeners(event).filter((listener) => !before.includes(listener));
}

function snapshotListeners() {
  return {
    SIGTERM: process.listeners('SIGTERM'),
    SIGINT: process.listeners('SIGINT'),
    exit: process.listeners('exit'),
  };
}

afterEach(async () => {
  const cached = globalThis[Symbol.for('lowdefy.devServer.dataStore')];
  if (cached !== undefined) {
    const store = await cached.catch(() => null);
    await store?.stop();
  }
  delete globalThis[Symbol.for('lowdefy.devServer.dataStore')];
  jest.restoreAllMocks();
  create.mockReset();
  listDatabases.mockReset();
});

test('getDataStore starts one replica set and returns the same store on every call', async () => {
  create.mockResolvedValue(createReplSet());
  const first = await getDataStore();
  const second = await getDataStore();
  expect(first).toBe(second);
  expect(first.uri).toEqual('mongodb://127.0.0.1:50001/?replicaSet=x');
  expect(create).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledWith({
    instanceOpts: [{ port: expect.any(Number) }],
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
});

test('getDataStore binds the store to a port in the dynamic range, above the usual app ports', async () => {
  create.mockResolvedValue(createReplSet());
  await getDataStore();
  const [[{ instanceOpts }]] = create.mock.calls;
  expect(instanceOpts[0].port).toBeGreaterThanOrEqual(MIN_PORT);
  expect(instanceOpts[0].port).toBeLessThanOrEqual(65535);
});

test('getDataStore clears a failed start so the next call retries', async () => {
  create.mockRejectedValueOnce(new Error('no mongod'));
  await expect(getDataStore()).rejects.toThrow('no mongod');
  create.mockResolvedValueOnce(createReplSet({ uri: 'mongodb://127.0.0.1:50002/' }));
  const store = await getDataStore();
  expect(store.uri).toEqual('mongodb://127.0.0.1:50002/');
});

test('a SIGTERM stops the store with cleanup, then raises the signal again', async () => {
  const replSet = createReplSet();
  create.mockResolvedValue(replSet);
  const kill = jest.spyOn(process, 'kill').mockImplementation(() => true);
  const before = snapshotListeners();
  await getDataStore();
  const [onSigterm] = addedListeners('SIGTERM', before.SIGTERM);
  expect(addedListeners('SIGINT', before.SIGINT)).toHaveLength(1);
  await onSigterm('SIGTERM');
  expect(replSet.stop).toHaveBeenCalledWith({ doCleanup: true });
  expect(kill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
  expect(globalThis[Symbol.for('lowdefy.devServer.dataStore')]).toBeUndefined();
  expect(addedListeners('SIGTERM', before.SIGTERM)).toEqual([]);
  expect(addedListeners('SIGINT', before.SIGINT)).toEqual([]);
  expect(addedListeners('exit', before.exit)).toEqual([]);
});

test('the exit hook kills mongod and removes its temporary directory when no stop finished', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mongo-mem-test-'));
  fs.writeFileSync(path.join(tmpDir, 'WiredTiger'), '');
  const mongodProcess = { kill: jest.fn() };
  create.mockResolvedValue(
    createReplSet({ instanceInfo: { tmpDir, dbPath: tmpDir, instance: { mongodProcess } } })
  );
  const before = snapshotListeners();
  await getDataStore();
  const [onExit] = addedListeners('exit', before.exit);
  onExit();
  expect(mongodProcess.kill).toHaveBeenCalledWith('SIGKILL');
  expect(fs.existsSync(tmpDir)).toBe(false);
});

test('a stopped store is replaced by a new one on the next getDataStore', async () => {
  const first = createReplSet({ uri: 'mongodb://127.0.0.1:50003/' });
  const second = createReplSet({ uri: 'mongodb://127.0.0.1:50004/' });
  create.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
  const store = await getDataStore();
  await store.stop();
  await store.stop();
  expect(first.stop).toHaveBeenCalledTimes(1);
  expect((await getDataStore()).uri).toEqual('mongodb://127.0.0.1:50004/');
});

test('a store whose mongod died is stopped by the next data session, and the one after starts a new store', async () => {
  const dead = createReplSet({ uri: 'mongodb://127.0.0.1:50005/' });
  const fresh = createReplSet({ uri: 'mongodb://127.0.0.1:50006/' });
  create.mockResolvedValueOnce(dead).mockResolvedValueOnce(fresh);
  await getDataStore();
  const gone = new Error('Server selection timed out after 5000 ms');
  gone.name = 'MongoServerSelectionError';
  listDatabases.mockRejectedValueOnce(gone);
  const error = await openDataSession({ dataSet: { name: 'shop', snapshot: null } }).catch(
    (caught) => caught
  );
  expect(error.message).toEqual(
    'The journey data store stopped responding (Server selection timed out after 5000 ms). The next journey starts a new one.'
  );
  expect(error.cause).toBe(gone);
  expect(dead.stop).toHaveBeenCalledWith({ doCleanup: true });
  expect((await getDataStore()).uri).toEqual('mongodb://127.0.0.1:50006/');
});

test('a data set that fails to load for another reason keeps the store', async () => {
  create.mockResolvedValueOnce(createReplSet());
  const store = await getDataStore();
  listDatabases.mockRejectedValueOnce(new Error('not authorized'));
  await expect(openDataSession({ dataSet: { name: 'shop', snapshot: null } })).rejects.toThrow(
    'not authorized'
  );
  expect(await getDataStore()).toBe(store);
});
