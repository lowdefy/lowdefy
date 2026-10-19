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
import getProcessStartTimeCommand from './getProcessStartTimeCommand.js';
import readProcessStartTime from './readProcessStartTime.js';

// Changes the machine's time zone, so it runs only on Windows CI, where the
// time zone is the system's and not a per-process TZ variable, in a step of
// its own that sets LOWDEFY_TEST_WINDOWS_TIME_ZONE: start time reads in other
// tests would fail while it runs, so `pnpm test` skips it.
const onWindows =
  process.platform === 'win32' && process.env.LOWDEFY_TEST_WINDOWS_TIME_ZONE === 'true'
    ? test
    : test.skip;

function powershell(command) {
  const result = spawnSync(
    'powershell.exe',
    ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', command],
    { encoding: 'utf8', windowsHide: true }
  );
  if (result.status !== 0) {
    throw new Error(`PowerShell failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

// Right after a time zone change WMI answers slowly, past the 15 s the
// readers allow, for a minute or more; until then they read null, which is
// "unknown" and safe. What must hold is that a read that completes names the
// same instant, so this reads with the same command and parser and a much
// longer timeout. jest cannot interrupt a synchronous read, so without one a
// hung WMI query would hold the job until the CI runner gives up.
const SLOW_READ_TIMEOUT_MS = 180000;

function readWithSlowTimeout({ pid }) {
  const { command, args, parse } = getProcessStartTimeCommand({ pid });
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    windowsHide: true,
    timeout: SLOW_READ_TIMEOUT_MS,
  });
  if (result.error) {
    throw new Error(`Start time read failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Start time read failed: ${result.stderr}`);
  }
  return parse(result.stdout);
}

onWindows(
  'getProcessStartTime reads the same instant for a process after the system time zone changes',
  async () => {
    const spawnedAt = Date.now();
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      stdio: 'ignore',
    });
    const originalZone = powershell('(Get-TimeZone).Id');
    try {
      const startTime = getProcessStartTime({ pid: child.pid });
      // The right instant, not just a stable one: a local time taken for UTC is hours off.
      expect(Math.abs(startTime - spawnedAt)).toBeLessThan(60000);
      // With and without daylight saving now, east and west of UTC.
      const zones = [
        'Tokyo Standard Time',
        'Pacific Standard Time',
        'AUS Eastern Standard Time',
        'South Africa Standard Time',
      ].filter((zone) => zone !== originalZone);
      for (const zone of zones) {
        powershell(`Set-TimeZone -Id '${zone}'`);
        expect(readWithSlowTimeout({ pid: child.pid })).toEqual(startTime);
        expect([startTime, null]).toContain(getProcessStartTime({ pid: child.pid }));
        expect([startTime, null]).toContain(await readProcessStartTime({ pid: child.pid }));
      }
    } finally {
      powershell(`Set-TimeZone -Id '${originalZone}'`);
      child.kill();
    }
  },
  600000
);
