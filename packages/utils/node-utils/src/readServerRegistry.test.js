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
jest.unstable_mockModule('./getProcessStartTime.js', () => ({
  default: ({ pid }) => running.get(pid) ?? null,
}));
jest.unstable_mockModule('./isPidAlive.js', () => ({
  default: (pid) => running.has(pid),
}));

const { default: readServerRegistry } = await import('./readServerRegistry.js');

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

test('readServerRegistry returns an empty list when the directory does not exist', () => {
  expect(readServerRegistry({ directory: path.join(directory, 'missing') })).toEqual([]);
});

test('readServerRegistry flags a live record with a live owner as not prunable', () => {
  running.set(100, 'server-start');
  running.set(200, 'owner-start');
  const record = writeRecord({
    pid: 100,
    startTime: 'server-start',
    ownerPid: 200,
    ownerStartTime: 'owner-start',
  });
  expect(readServerRegistry({ directory })).toEqual([
    {
      ...record,
      recordPath: path.join(directory, '100.json'),
      ownerAlive: true,
      prunable: false,
    },
  ]);
});

test('readServerRegistry flags a live record whose owner is gone as prunable', () => {
  running.set(100, 'server-start');
  writeRecord({
    pid: 100,
    startTime: 'server-start',
    ownerPid: 200,
    ownerStartTime: 'owner-start',
  });
  const [record] = readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(false);
  expect(record.prunable).toBe(true);
});

test('readServerRegistry takes an owner pid reused by another process as gone', () => {
  running.set(100, 'server-start');
  running.set(200, 'someone-else-start');
  writeRecord({
    pid: 100,
    startTime: 'server-start',
    ownerPid: 200,
    ownerStartTime: 'owner-start',
  });
  const [record] = readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(false);
  expect(record.prunable).toBe(true);
});

test('readServerRegistry deletes and skips a record whose process is gone', () => {
  running.set(200, 'owner-start');
  writeRecord({
    pid: 100,
    startTime: 'server-start',
    ownerPid: 200,
    ownerStartTime: 'owner-start',
  });
  expect(readServerRegistry({ directory })).toEqual([]);
  expect(fs.readdirSync(directory)).toEqual([]);
});

test('readServerRegistry deletes and skips a record whose pid was reused', () => {
  running.set(100, 'later-start');
  running.set(200, 'owner-start');
  writeRecord({
    pid: 100,
    startTime: 'server-start',
    ownerPid: 200,
    ownerStartTime: 'owner-start',
  });
  expect(readServerRegistry({ directory })).toEqual([]);
  expect(fs.readdirSync(directory)).toEqual([]);
});

test('readServerRegistry uses the pid alone for a record without start times', () => {
  running.set(100, null);
  running.set(200, null);
  writeRecord({ pid: 100, startTime: null, ownerPid: 200, ownerStartTime: null });
  const [record] = readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(true);
  expect(record.prunable).toBe(false);
});

test('readServerRegistry never flags a record without a start time as prunable, even with its owner gone', () => {
  running.set(100, null);
  writeRecord({ pid: 100, startTime: null, ownerPid: 200, ownerStartTime: null });
  const [record] = readServerRegistry({ directory });
  expect(record.ownerAlive).toBe(false);
  expect(record.prunable).toBe(false);
});

test('readServerRegistry skips unreadable files, temporary files and records without an owner', () => {
  running.set(100, 'server-start');
  fs.writeFileSync(path.join(directory, 'broken.json'), '{ not json');
  fs.writeFileSync(path.join(directory, '300.json.tmp'), '{}');
  fs.writeFileSync(
    path.join(directory, '100.json'),
    JSON.stringify({ pid: 100, processStartTime: 'server-start' })
  );
  expect(readServerRegistry({ directory })).toEqual([]);
  expect(fs.readdirSync(directory).sort()).toEqual(['100.json', '300.json.tmp', 'broken.json']);
});
