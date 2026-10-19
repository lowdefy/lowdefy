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

import { spawn } from 'child_process';

import getProcessStartTime from './getProcessStartTime.js';
import readProcessStartTime from './readProcessStartTime.js';

test('readProcessStartTime reads the same start time as getProcessStartTime', async () => {
  const startTime = await readProcessStartTime({ pid: process.pid });
  expect(startTime).not.toBeNull();
  expect(startTime).toEqual(getProcessStartTime({ pid: process.pid }));
}, 30000);

test('readProcessStartTime reads the start time of a process it did not start', async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
  });
  try {
    const startTime = await readProcessStartTime({ pid: child.pid });
    expect(startTime).not.toBeNull();
    expect(await readProcessStartTime({ pid: child.pid })).toEqual(startTime);
  } finally {
    child.kill();
  }
}, 30000);

test('readProcessStartTime resolves to null for a pid that is not running', async () => {
  expect(await readProcessStartTime({ pid: 2 ** 22 + 12345 })).toBeNull();
}, 30000);
