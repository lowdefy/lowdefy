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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

// pid -> start time of the processes "running" in each test.
let running;
jest.unstable_mockModule('./readProcessStartTime.js', () => ({
  default: async ({ pid }) => running.get(pid) ?? null,
}));
jest.unstable_mockModule('./isPidAlive.js', () => ({
  default: (pid) => running.has(pid),
}));

const { default: readServerRegistry } = await import('./readServerRegistry.js');

// Start times in epoch milliseconds.
const SERVER_START = 1790000000000;
const OWNER_START = 1790000001000;
const OTHER_START = 1790000002000;

let directory;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-registry-'));
  running = new Map();
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

function writeRecord({ pid, startTime, ownerPid, ownerStartTime }) {
  const record = {
    pid,
    processStartTime: startTime,
    kind: 'server',
    cwd: '/apps/one/.lowdefy/server',
    configDirectory: '/apps/one',
    port: 3112,
    owner: { pid: ownerPid, processStartTime: ownerStartTime, via: 'cli' },
    startedAt: '2026-10-02T08:00:00.000Z',
  };
  fs.writeFileSync(path.join(directory, `${pid}.json`), JSON.stringify(record));
  return record;
}

test('readServerRegistry returns an empty list when the directory does not exist', async () => {
  expect(await readServerRegistry({ directory: path.join(directory, 'missing') })).toEqual([]);
});

test('readServerRegistry flags a live record with a live owner as not prunable', async () => {
  running.set(100, SERVER_START);
  running.set(200, OWNER_START);
  const record = writeRecord({
    pid: 100,
    startTime: SERVER_START,
    ownerPid: 200,
    ownerStartTime: OWNER_START,
  });
  expect(await readServerRegistry({ directory })).toEqual([
    {
      ...record,
      recordPath: path.join(directory, '100.json'),
      ownerAlive: true,
      prunable: false,
    },
  ]);
});

test('readServerRegistry flags a live record whose owner is gone as prunable', async () => {
  running.set(100, SERVER_START);
  writeRecord({
    pid: 100,
    startTime: SERVER_START,
    ownerPid: 200,
    ownerStartTime: OWNER_START,
  });
  const [record] = await readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(false);
  expect(record.prunable).toBe(true);
});

test('readServerRegistry takes an owner pid reused by another process as gone', async () => {
  running.set(100, SERVER_START);
  running.set(200, OTHER_START);
  writeRecord({
    pid: 100,
    startTime: SERVER_START,
    ownerPid: 200,
    ownerStartTime: OWNER_START,
  });
  const [record] = await readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(false);
  expect(record.prunable).toBe(true);
});

test('readServerRegistry deletes and skips a record whose process is gone', async () => {
  running.set(200, OWNER_START);
  writeRecord({
    pid: 100,
    startTime: SERVER_START,
    ownerPid: 200,
    ownerStartTime: OWNER_START,
  });
  expect(await readServerRegistry({ directory })).toEqual([]);
  expect(fs.readdirSync(directory)).toEqual([]);
});

test('readServerRegistry deletes and skips a record whose pid was reused', async () => {
  running.set(100, OTHER_START);
  running.set(200, OWNER_START);
  writeRecord({
    pid: 100,
    startTime: SERVER_START,
    ownerPid: 200,
    ownerStartTime: OWNER_START,
  });
  expect(await readServerRegistry({ directory })).toEqual([]);
  expect(fs.readdirSync(directory)).toEqual([]);
});

test('readServerRegistry uses the pid alone for a record without start times', async () => {
  running.set(100, null);
  running.set(200, null);
  writeRecord({ pid: 100, startTime: null, ownerPid: 200, ownerStartTime: null });
  const [record] = await readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(true);
  expect(record.prunable).toBe(false);
});

test('readServerRegistry never flags a record without a start time as prunable, even with its owner gone', async () => {
  running.set(100, null);
  writeRecord({ pid: 100, startTime: null, ownerPid: 200, ownerStartTime: null });
  const [record] = await readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(false);
  expect(record.prunable).toBe(false);
});

test('readServerRegistry skips unreadable files, temporary files and records without an owner', async () => {
  running.set(100, SERVER_START);
  fs.writeFileSync(path.join(directory, 'broken.json'), '{ not json');
  fs.writeFileSync(path.join(directory, '300.json.tmp'), '{}');
  fs.writeFileSync(
    path.join(directory, '100.json'),
    JSON.stringify({ pid: 100, processStartTime: SERVER_START })
  );
  expect(await readServerRegistry({ directory })).toEqual([]);
  expect(fs.readdirSync(directory).sort()).toEqual(['100.json', '300.json.tmp', 'broken.json']);
});

test('readServerRegistry treats a start time recorded as local time by an older Lowdefy as unknown', async () => {
  running.set(100, SERVER_START);
  running.set(200, OWNER_START);
  writeRecord({
    pid: 100,
    startTime: 'Fri Oct  2 20:55:31 2026',
    ownerPid: 200,
    ownerStartTime: 'Fri Oct  2 20:55:27 2026',
  });
  const [record] = await readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(true);
  expect(record.prunable).toBe(false);
  expect(fs.readdirSync(directory)).toEqual(['100.json']);
});

test('readServerRegistry never flags a record with a local-time start time as prunable, even with its owner gone', async () => {
  running.set(100, SERVER_START);
  writeRecord({
    pid: 100,
    startTime: 'Fri Oct  2 20:55:31 2026',
    ownerPid: 200,
    ownerStartTime: OWNER_START,
  });
  const [record] = await readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(false);
  expect(record.prunable).toBe(false);
});

test('readServerRegistry keeps a record whose start time cannot be read now', async () => {
  running.set(100, null);
  running.set(200, null);
  writeRecord({ pid: 100, startTime: SERVER_START, ownerPid: 200, ownerStartTime: OWNER_START });
  const [record] = await readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(true);
  expect(record.prunable).toBe(false);
});
