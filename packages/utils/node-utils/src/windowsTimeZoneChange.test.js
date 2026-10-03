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

import { wait } from '@lowdefy/helpers';

import getProcessStartTime from './getProcessStartTime.js';
import getProcessStartTimeCommand from './getProcessStartTimeCommand.js';
import readProcessStartTime from './readProcessStartTime.js';

// Changes the machine's time zone, so it runs only on Windows CI, where the
// time zone is the system's and not a per-process TZ variable, in a step of
// its own: start time reads in other tests would fail while it runs.
const onWindows = process.platform === 'win32' ? test : test.skip;

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

// Right after a time zone change WMI can fail a read for a moment. A failed
// read is "unknown" and safe; what must hold is that a read that succeeds
// names the same instant.
async function readOnceAvailable({ pid }) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const startTime = getProcessStartTime({ pid });
    if (startTime !== null) {
      return startTime;
    }
    await wait(1000);
  }
  const { command, args } = getProcessStartTimeCommand({ pid });
  const raw = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  throw new Error(
    `No start time read in 60 s. status ${raw.status}, stdout ${JSON.stringify(
      raw.stdout
    )}, stderr ${JSON.stringify(raw.stderr)}`
  );
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
        expect(await readOnceAvailable({ pid: child.pid })).toEqual(startTime);
        const asyncRead = await readProcessStartTime({ pid: child.pid });
        expect([startTime, null]).toContain(asyncRead);
      }
    } finally {
      powershell(`Set-TimeZone -Id '${originalZone}'`);
      child.kill();
    }
  },
  600000
);
