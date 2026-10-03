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

const mockGetProcessStartTime = jest.fn();
jest.unstable_mockModule('child_process', () => ({
  spawnSync: mockGetProcessStartTime,
  execSync: mockGetProcessStartTime,
  execFileSync: mockGetProcessStartTime,
  execFile: mockGetProcessStartTime,
  spawn: mockGetProcessStartTime,
}));

const { default: readInstanceRecord } = await import('./readInstanceRecord.js');
const { default: startIdleGc } = await import('./startIdleGc.js');

const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-instance-record-'));
const recordPath = path.join(configDirectory, '.lowdefy', 'instance.json');
const STARTED = Symbol.for('lowdefy.server-dev.idleGc');

afterAll(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

afterEach(() => {
  fs.rmSync(path.join(configDirectory, '.lowdefy'), { recursive: true, force: true });
  delete globalThis[STARTED];
});

function writeRecord(record) {
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(recordPath, typeof record === 'string' ? record : JSON.stringify(record));
}

test('readInstanceRecord returns the record as written, without checking the manager process', () => {
  writeRecord({ pid: 999999, lastActivityAt: '2026-10-03T10:00:00.000Z', activeRequests: 0 });

  expect(readInstanceRecord({ configDirectory })).toEqual({
    pid: 999999,
    lastActivityAt: '2026-10-03T10:00:00.000Z',
    activeRequests: 0,
  });
  expect(mockGetProcessStartTime).not.toHaveBeenCalled();
});

test('readInstanceRecord returns null when there is no record', () => {
  expect(readInstanceRecord({ configDirectory })).toBeNull();
});

test('readInstanceRecord returns null for a record caught mid-write', () => {
  writeRecord('{"pid": 12');

  expect(readInstanceRecord({ configDirectory })).toBeNull();
});

test('the idle GC poll reads the record and collects without spawning a process', () => {
  // performance is not redefinable on this Node, and nothing here reads it.
  jest.useFakeTimers({ doNotFake: ['performance'] });
  try {
    const gc = jest.fn();
    const start = Date.parse('2026-10-03T10:00:00.000Z');
    // A full record, which readDevInstance would check with ps.
    writeRecord({
      pid: process.pid,
      configDirectory: fs.realpathSync.native(configDirectory),
      processStartTime: 'Sat Oct  3 10:00:00 2026',
      lastActivityAt: new Date(start).toISOString(),
      activeRequests: 0,
      building: false,
    });

    startIdleGc({ configDirectory, gc, now: () => start + 10_000 });
    jest.advanceTimersByTime(5000);

    expect(gc).toHaveBeenCalledTimes(1);
    expect(mockGetProcessStartTime).not.toHaveBeenCalled();
  } finally {
    jest.clearAllTimers();
    jest.useRealTimers();
  }
});
