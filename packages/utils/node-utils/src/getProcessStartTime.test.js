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

import { spawn, spawnSync } from 'child_process';

import getProcessStartTime from './getProcessStartTime.js';

// Hubs, shims and CLIs each run with the environment of the session that
// started them.
function readInProcess({ pid, env }) {
  const moduleUrl = new URL('./getProcessStartTime.js', import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import get from '${moduleUrl}'; console.log(get({ pid: ${pid} }));`,
    ],
    { encoding: 'utf8', env: { ...process.env, ...env } }
  );
  return result.stdout.trim();
}

test('getProcessStartTime reads the same start time whatever time zone and locale its reader runs with', () => {
  const first = readInProcess({ pid: process.pid, env: { TZ: 'UTC', LC_ALL: 'C' } });
  const second = readInProcess({
    pid: process.pid,
    env: { TZ: 'Pacific/Auckland', LC_ALL: 'de_DE.UTF-8', LANG: 'de_DE.UTF-8' },
  });
  expect(first).not.toEqual('null');
  expect(second).toEqual(first);
}, 30000);

test('getProcessStartTime reads the start time as epoch milliseconds in UTC', () => {
  const spawnedAt = Date.now();
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
  });
  try {
    // A reader far from UTC: a start time read as its local time would be hours off.
    const startTime = Number(readInProcess({ pid: child.pid, env: { TZ: 'Pacific/Auckland' } }));
    expect(Number.isInteger(startTime)).toBe(true);
    // ps prints whole seconds.
    expect(Math.abs(startTime - spawnedAt)).toBeLessThan(60000);
    expect(getProcessStartTime({ pid: child.pid })).toEqual(startTime);
  } finally {
    child.kill();
  }
}, 30000);

test('getProcessStartTime returns null for a pid that is not running', () => {
  expect(getProcessStartTime({ pid: 2 ** 22 + 12345 })).toBeNull();
}, 30000);
