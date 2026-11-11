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

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const spawnDataStoreKeeper = vi.fn();
vi.doMock('./spawnDataStoreKeeper.js', () => ({ default: spawnDataStoreKeeper }));

const { default: readRunStoreRecord } = await import('./readRunStoreRecord.js');
const { default: waitForRunStoreRecord } = await import('./waitForRunStoreRecord.js');
const { default: writeRunStoreRecord } = await import('./writeRunStoreRecord.js');

const uri = 'mongodb://127.0.0.1:50001/?replicaSet=testset';
let directory;
let recordPath;

// A keeper that starts at once: it publishes the URI under this process's pid, which is alive.
function startKeeper({ ownerPid, recordPath: keeperRecordPath, token }) {
  writeRunStoreRecord({
    recordPath: keeperRecordPath,
    record: { ownerPid, keeperPid: process.pid, token, uri },
  });
}

function deadPid() {
  return spawnSync(process.execPath, ['-e', '']).pid;
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-store-'));
  recordPath = path.join(directory, 'data-store-9.json');
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('waitForRunStoreRecord claims the record, starts one keeper and returns the record once it has a URI', async () => {
  spawnDataStoreKeeper.mockImplementation(startKeeper);
  const record = await waitForRunStoreRecord({ ownerPid: 9, recordPath, timeoutMs: 5000 });
  expect(record.uri).toEqual(uri);
  expect(spawnDataStoreKeeper).toHaveBeenCalledTimes(1);
  expect(spawnDataStoreKeeper).toHaveBeenCalledWith({
    ownerPid: 9,
    recordPath,
    token: record.token,
  });
});

test('waitForRunStoreRecord joins a store another process started, without starting a keeper', async () => {
  writeRunStoreRecord({
    recordPath,
    record: { ownerPid: 9, keeperPid: process.pid, token: 't', uri },
  });
  const record = await waitForRunStoreRecord({ ownerPid: 9, recordPath, timeoutMs: 5000 });
  expect(record.uri).toEqual(uri);
  expect(spawnDataStoreKeeper).not.toHaveBeenCalled();
});

test('waitForRunStoreRecord waits while another process holds the claim and its keeper has no URI yet', async () => {
  writeRunStoreRecord({
    recordPath,
    record: { ownerPid: 9, starterPid: process.pid, keeperPid: null, token: 't', uri: null },
  });
  setTimeout(() => {
    writeRunStoreRecord({
      recordPath,
      record: { ownerPid: 9, keeperPid: process.pid, token: 't', uri },
    });
  }, 150);
  const record = await waitForRunStoreRecord({ ownerPid: 9, recordPath, timeoutMs: 5000 });
  expect(record.uri).toEqual(uri);
  expect(spawnDataStoreKeeper).not.toHaveBeenCalled();
});

test('waitForRunStoreRecord replaces a record whose keeper is gone', async () => {
  writeRunStoreRecord({
    recordPath,
    record: { ownerPid: 9, keeperPid: deadPid(), token: 'old', uri: 'mongodb://127.0.0.1:1/' },
  });
  spawnDataStoreKeeper.mockImplementation(startKeeper);
  const record = await waitForRunStoreRecord({ ownerPid: 9, recordPath, timeoutMs: 5000 });
  expect(record.uri).toEqual(uri);
  expect(record.token).not.toEqual('old');
  expect(spawnDataStoreKeeper).toHaveBeenCalledTimes(1);
});

test('waitForRunStoreRecord throws the reason a keeper could not start and removes the record', async () => {
  writeRunStoreRecord({
    recordPath,
    record: { ownerPid: 9, keeperPid: process.pid, token: 't', uri: null, error: 'no binary' },
  });
  await expect(waitForRunStoreRecord({ ownerPid: 9, recordPath, timeoutMs: 5000 })).rejects.toThrow(
    'The test data store could not start: no binary'
  );
  expect(readRunStoreRecord({ recordPath })).toBeNull();
});

test('waitForRunStoreRecord throws the reason of a keeper that has exited, without starting another', async () => {
  writeRunStoreRecord({
    recordPath,
    record: { ownerPid: 9, keeperPid: deadPid(), token: 't', uri: null, error: 'no binary' },
  });
  await expect(waitForRunStoreRecord({ ownerPid: 9, recordPath, timeoutMs: 5000 })).rejects.toThrow(
    'The test data store could not start: no binary'
  );
  expect(readRunStoreRecord({ recordPath })).toBeNull();
  expect(spawnDataStoreKeeper).not.toHaveBeenCalled();
});

test('waitForRunStoreRecord gives up after the timeout, naming the record', async () => {
  spawnDataStoreKeeper.mockImplementation(() => {});
  await expect(waitForRunStoreRecord({ ownerPid: 9, recordPath, timeoutMs: 200 })).rejects.toThrow(
    `The test data store did not start within 0 s. Its record is "${recordPath}".`
  );
});
