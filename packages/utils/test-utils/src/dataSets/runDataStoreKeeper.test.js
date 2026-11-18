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

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const startDataStoreReplSet = vi.fn();
vi.doMock('./startDataStoreReplSet.js', () => ({ default: startDataStoreReplSet }));
const countStoreClients = vi.fn();
vi.doMock('./countStoreClients.js', () => ({ default: countStoreClients }));
const closeClient = vi.fn(async () => {});
vi.doMock('mongodb', () => ({
  MongoClient: class {
    close() {
      return closeClient();
    }
  },
}));

const { default: readRunStoreRecord } = await import('./readRunStoreRecord.js');
const { default: runDataStoreKeeper, IDLE_STOP_MS } = await import('./runDataStoreKeeper.js');
const { default: writeRunStoreRecord } = await import('./writeRunStoreRecord.js');

// The keeper's life with a real mongod (publishing the URI, stopping with its owner or when
// idle) is in getRunDataStore.mongodb.test.js. These are the two ways it ends before it has a
// store, and when it stops for lack of clients, on fake timers with the count of clients mocked.

const STOP_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'];
const uri = 'mongodb://127.0.0.1:50001/?replicaSet=testset';
let directory;
let recordPath;
let listenersBefore;
let exit;
let replSet;

function claimRecord() {
  writeRunStoreRecord({
    recordPath,
    record: { ownerPid: process.pid, starterPid: 1, keeperPid: null, token: 'mine', uri: null },
  });
}

// A keeper owned by this process, which stays alive, on a store whose start is mocked.
async function startKeeper() {
  claimRecord();
  await runDataStoreKeeper({ ownerPid: process.pid, recordPath, token: 'mine' });
  expect(readRunStoreRecord({ recordPath }).uri).toEqual(uri);
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-store-'));
  recordPath = path.join(directory, 'data-store-5.json');
  listenersBefore = Object.fromEntries(
    [...STOP_SIGNALS, 'exit'].map((event) => [event, process.listeners(event)])
  );
  exit = vi.spyOn(process, 'exit').mockImplementation(() => {});
  replSet = { getUri: () => uri, stop: vi.fn(async () => {}), servers: [] };
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  exit.mockRestore();
  Object.entries(listenersBefore).forEach(([event, listeners]) => {
    process
      .listeners(event)
      .filter((listener) => !listeners.includes(listener))
      .forEach((listener) => process.off(event, listener));
  });
  fs.rmSync(directory, { recursive: true, force: true });
  process.exitCode = undefined;
});

test('runDataStoreKeeper starts nothing when the record carries another claim', async () => {
  const record = { ownerPid: 5, starterPid: 1, keeperPid: null, token: 'theirs', uri: null };
  writeRunStoreRecord({ recordPath, record });
  await runDataStoreKeeper({ ownerPid: 5, recordPath, token: 'mine' });
  expect(startDataStoreReplSet).not.toHaveBeenCalled();
  expect(readRunStoreRecord({ recordPath })).toEqual(record);
});

test('runDataStoreKeeper writes why mongod could not start, for the test processes waiting on it', async () => {
  writeRunStoreRecord({
    recordPath,
    record: { ownerPid: 5, starterPid: 1, keeperPid: null, token: 'mine', uri: null },
  });
  startDataStoreReplSet.mockRejectedValue(new Error('Could not download mongod'));
  await runDataStoreKeeper({ ownerPid: 5, recordPath, token: 'mine' });
  expect(readRunStoreRecord({ recordPath })).toEqual({
    ownerPid: 5,
    keeperPid: process.pid,
    token: 'mine',
    uri: null,
    error: 'Could not download mongod',
  });
  expect(process.exitCode).toEqual(1);
});

test('runDataStoreKeeper lets its record go once no client has used the store for the idle time, and stops at the next poll', async () => {
  vi.useFakeTimers();
  startDataStoreReplSet.mockResolvedValue(replSet);
  countStoreClients.mockResolvedValue(0);
  await startKeeper();
  await vi.advanceTimersByTimeAsync(IDLE_STOP_MS - 1000);
  expect(readRunStoreRecord({ recordPath })).not.toBeNull();
  await vi.advanceTimersByTimeAsync(1000);
  // No new test process can join now; one that read the record just before still could.
  expect(readRunStoreRecord({ recordPath })).toBeNull();
  expect(replSet.stop).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1000);
  expect(replSet.stop).toHaveBeenCalledWith({ doCleanup: true });
  expect(closeClient).toHaveBeenCalled();
  expect(exit).toHaveBeenCalledWith(0);
});

test('runDataStoreKeeper keeps a store a test process holds a client on, past the idle time', async () => {
  vi.useFakeTimers();
  startDataStoreReplSet.mockResolvedValue(replSet);
  countStoreClients.mockResolvedValue(1);
  await startKeeper();
  await vi.advanceTimersByTimeAsync(IDLE_STOP_MS * 4);
  expect(readRunStoreRecord({ recordPath }).uri).toEqual(uri);
  expect(replSet.stop).not.toHaveBeenCalled();
  // The idle time counts from the last poll that saw a client.
  countStoreClients.mockResolvedValue(0);
  await vi.advanceTimersByTimeAsync(IDLE_STOP_MS - 1000);
  expect(readRunStoreRecord({ recordPath })).not.toBeNull();
  await vi.advanceTimersByTimeAsync(2000);
  expect(readRunStoreRecord({ recordPath })).toBeNull();
  expect(replSet.stop).toHaveBeenCalled();
});

test('runDataStoreKeeper serves a client that joined as it let its record go, until the client leaves', async () => {
  vi.useFakeTimers();
  startDataStoreReplSet.mockResolvedValue(replSet);
  countStoreClients.mockResolvedValue(0);
  await startKeeper();
  await vi.advanceTimersByTimeAsync(IDLE_STOP_MS);
  expect(readRunStoreRecord({ recordPath })).toBeNull();
  countStoreClients.mockResolvedValue(1);
  await vi.advanceTimersByTimeAsync(IDLE_STOP_MS * 2);
  expect(replSet.stop).not.toHaveBeenCalled();
  expect(exit).not.toHaveBeenCalled();
  countStoreClients.mockResolvedValue(0);
  await vi.advanceTimersByTimeAsync(1000);
  expect(replSet.stop).toHaveBeenCalled();
  expect(exit).toHaveBeenCalledWith(0);
});

test('runDataStoreKeeper stops a store mongod no longer answers on', async () => {
  vi.useFakeTimers();
  startDataStoreReplSet.mockResolvedValue(replSet);
  countStoreClients.mockRejectedValue(
    Object.assign(new Error('gone'), { name: 'MongoServerSelectionError' })
  );
  await startKeeper();
  await vi.advanceTimersByTimeAsync(1000);
  expect(readRunStoreRecord({ recordPath })).toBeNull();
  expect(replSet.stop).toHaveBeenCalled();
  expect(exit).toHaveBeenCalledWith(0);
});

test('runDataStoreKeeper serves the clients it has when another process removes its record, and stops once they leave', async () => {
  vi.useFakeTimers();
  startDataStoreReplSet.mockResolvedValue(replSet);
  countStoreClients.mockResolvedValue(1);
  await startKeeper();
  // A join that could not connect in time removes the record.
  fs.rmSync(recordPath);
  await vi.advanceTimersByTimeAsync(IDLE_STOP_MS * 2);
  expect(replSet.stop).not.toHaveBeenCalled();
  expect(exit).not.toHaveBeenCalled();
  countStoreClients.mockResolvedValue(0);
  await vi.advanceTimersByTimeAsync(1000);
  expect(replSet.stop).toHaveBeenCalled();
  expect(exit).toHaveBeenCalledWith(0);
});

test('runDataStoreKeeper keeps the store when counting its clients fails for another reason than a dead mongod', async () => {
  vi.useFakeTimers();
  startDataStoreReplSet.mockResolvedValue(replSet);
  countStoreClients.mockRejectedValue(
    Object.assign(new Error('connection closed'), { name: 'MongoNetworkError' })
  );
  await startKeeper();
  await vi.advanceTimersByTimeAsync(5000);
  expect(readRunStoreRecord({ recordPath }).uri).toEqual(uri);
  expect(replSet.stop).not.toHaveBeenCalled();
});

test('runDataStoreKeeper counts again after a count mongod never answers, and still stops once idle', async () => {
  vi.useFakeTimers();
  startDataStoreReplSet.mockResolvedValue(replSet);
  // A hung mongod: the first count never settles. The ones after it find no client.
  countStoreClients.mockReturnValueOnce(new Promise(() => {})).mockResolvedValue(0);
  await startKeeper();
  await vi.advanceTimersByTimeAsync(1000);
  expect(countStoreClients).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(IDLE_STOP_MS + 10000);
  expect(countStoreClients.mock.calls.length).toBeGreaterThan(1);
  expect(readRunStoreRecord({ recordPath })).toBeNull();
  expect(replSet.stop).toHaveBeenCalledWith({ doCleanup: true });
  expect(exit).toHaveBeenCalledWith(0);
});
