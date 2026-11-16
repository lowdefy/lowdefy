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

const { default: readRunStoreRecord } = await import('./readRunStoreRecord.js');
const { default: runDataStoreKeeper } = await import('./runDataStoreKeeper.js');
const { default: writeRunStoreRecord } = await import('./writeRunStoreRecord.js');

// The keeper's life with a real mongod (publishing the URI, stopping with its owner) is in
// getRunDataStore.mongodb.test.js; these are the two ways it ends before it has a store.

let directory;
let recordPath;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-store-'));
  recordPath = path.join(directory, 'data-store-5.json');
});

afterEach(() => {
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
