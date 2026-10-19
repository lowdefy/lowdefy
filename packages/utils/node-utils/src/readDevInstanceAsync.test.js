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

const mockReadProcessStartTime = jest.fn();
jest.unstable_mockModule('./readProcessStartTime.js', () => ({
  default: mockReadProcessStartTime,
}));

const { default: getDevInstancePath } = await import('./getDevInstancePath.js');
const { default: readDevInstanceAsync } = await import('./readDevInstanceAsync.js');

// Epoch milliseconds.
const START_TIME = 1790000000000;
let configDirectory;
let now = Date.now();

beforeEach(() => {
  // Past the start time cache, so each test reads afresh.
  now += 60000;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  mockReadProcessStartTime.mockReset();
  mockReadProcessStartTime.mockResolvedValue(START_TIME);
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

test('readDevInstanceAsync returns null when no instance record exists', async () => {
  expect(await readDevInstanceAsync({ configDirectory })).toBe(null);
});

test('readDevInstanceAsync ignores a record copied from another checkout', async () => {
  writeRecord({ pid: process.pid, configDirectory: '/somewhere/else', port: 4100 });
  expect(await readDevInstanceAsync({ configDirectory })).toBe(null);
});

test.each([
  ['is the process that wrote it', START_TIME, true],
  ['now belongs to another process', 0, false],
  ['has a start time that cannot be read', null, true],
])('readDevInstanceAsync with a live pid that %s', async (_, startTime, live) => {
  writeRecord({ pid: process.pid, processStartTime: START_TIME, configDirectory });
  mockReadProcessStartTime.mockResolvedValue(startTime);
  expect((await readDevInstanceAsync({ configDirectory })) !== null).toBe(live);
});

test('readDevInstanceAsync trusts a live pid whose record holds a start time in an older format', async () => {
  writeRecord({ pid: process.pid, processStartTime: 'Sun Sep 27 08:00:00 2026', configDirectory });
  expect(await readDevInstanceAsync({ configDirectory })).toMatchObject({ pid: process.pid });
  expect(mockReadProcessStartTime).not.toHaveBeenCalled();
});

test('readDevInstanceAsync reads a pid start time once while polling', async () => {
  writeRecord({ pid: process.pid, processStartTime: START_TIME, configDirectory });
  await readDevInstanceAsync({ configDirectory });
  now += 100;
  await readDevInstanceAsync({ configDirectory });
  expect(mockReadProcessStartTime).toHaveBeenCalledTimes(1);
  now += 10000;
  await readDevInstanceAsync({ configDirectory });
  expect(mockReadProcessStartTime).toHaveBeenCalledTimes(2);
});
