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
import fs from 'fs';
import os from 'os';
import path from 'path';

const mockGetProcessStartTime = jest.fn();
jest.unstable_mockModule('./getProcessStartTime.js', () => ({
  default: mockGetProcessStartTime,
}));

const { default: getDevInstancePath } = await import('./getDevInstancePath.js');
const { default: readDevInstance } = await import('./readDevInstance.js');

const START_TIME = 'Sun Sep 27 08:00:00 2026';
let configDirectory;
let now = Date.now();

beforeEach(() => {
  // Past the start time cache, so each test reads afresh.
  now += 60000;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  mockGetProcessStartTime.mockReset();
  mockGetProcessStartTime.mockReturnValue(START_TIME);
  configDirectory = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-instance-'))
  );
  fs.mkdirSync(path.join(configDirectory, '.lowdefy'));
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeRecord(record) {
  fs.writeFileSync(getDevInstancePath({ configDirectory }), JSON.stringify(record));
}

test('readDevInstance returns null when no instance record exists', () => {
  expect(readDevInstance({ configDirectory })).toBe(null);
});

test('readDevInstance returns the record when it names this directory and its pid is alive', () => {
  const record = { pid: process.pid, configDirectory, port: 4100 };
  writeRecord(record);
  expect(readDevInstance({ configDirectory })).toEqual(record);
});

// Case variants name one directory only where the file system ignores case.
const tmpReal = fs.realpathSync.native(os.tmpdir());
const onCaseInsensitiveFs =
  tmpReal !== tmpReal.toUpperCase() && fs.existsSync(tmpReal.toUpperCase()) ? test : test.skip;

onCaseInsensitiveFs('readDevInstance finds the record from a case variant of its directory', () => {
  const record = { pid: process.pid, configDirectory, port: 4100 };
  writeRecord(record);
  expect(readDevInstance({ configDirectory: configDirectory.toUpperCase() })).toEqual(record);
});

test('readDevInstance ignores a record copied from another checkout', () => {
  writeRecord({ pid: process.pid, configDirectory: '/somewhere/else', port: 4100 });
  expect(readDevInstance({ configDirectory })).toBe(null);
});

test('readDevInstance ignores a record whose process has exited', () => {
  writeRecord({ pid: 2 ** 22 + 12345, configDirectory, port: 4100 });
  expect(readDevInstance({ configDirectory })).toBe(null);
});

test('readDevInstance returns null for an unreadable record', () => {
  fs.writeFileSync(getDevInstancePath({ configDirectory }), '{ not json');
  expect(readDevInstance({ configDirectory })).toBe(null);
});

test.each([
  ['is the process that wrote it', START_TIME, true],
  ['now belongs to another process', 'Thu Jan  1 00:00:00 1970', false],
])('readDevInstance with a live pid that %s', (_, processStartTime, live) => {
  writeRecord({ pid: process.pid, processStartTime: START_TIME, configDirectory });
  mockGetProcessStartTime.mockReturnValue(processStartTime);
  expect(readDevInstance({ configDirectory }) !== null).toBe(live);
});

test('readDevInstance trusts a live pid when its start time cannot be read', () => {
  writeRecord({ pid: process.pid, processStartTime: START_TIME, configDirectory });
  mockGetProcessStartTime.mockReturnValue(null);
  expect(readDevInstance({ configDirectory })).toMatchObject({ pid: process.pid });
});

test('readDevInstance reads a pid start time once while polling', () => {
  writeRecord({ pid: process.pid, processStartTime: START_TIME, configDirectory });
  readDevInstance({ configDirectory });
  now += 100;
  readDevInstance({ configDirectory });
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(1);
  now += 10000;
  readDevInstance({ configDirectory });
  expect(mockGetProcessStartTime).toHaveBeenCalledTimes(2);
});
