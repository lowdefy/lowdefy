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

import { type } from '@lowdefy/helpers';

// A pid alone does not identify a process: after a reboot, or enough churn,
// the pid in a record can belong to something else entirely. The pid plus its
// start time does.
//
// macOS and Linux: ps prints lstart in the caller's time zone and locale.
// Hubs, shims and CLIs run with the environment of whichever session started
// them, so without pinning both, a reader in another session would read
// another string for the same process - and a hub would drop, orphaning, every
// server it should adopt.
//
// Windows has no ps. The process creation time comes from WMI, converted to
// UTC and printed in the round-trip format, so every reader prints the same
// string whatever its time zone or culture. PowerShell takes a few hundred
// milliseconds to start, so callers that poll read it rarely or off the event
// loop (readProcessStartTime).
function getProcessStartTimeCommand({ pid, platform = process.platform }) {
  // The pid is written into a PowerShell command line.
  if (!type.isInt(pid) || pid <= 0) {
    throw new Error(`Process id must be a positive integer. Received ${JSON.stringify(pid)}.`);
  }
  if (platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `$p = Get-CimInstance -ClassName Win32_Process -Filter 'ProcessId = ${pid}'; if ($p) { $p.CreationDate.ToUniversalTime().ToString('o') }`,
      ],
      options: { windowsHide: true, timeout: 15000 },
    };
  }
  return {
    command: 'ps',
    args: ['-o', 'lstart=', '-p', String(pid)],
    options: { env: { ...process.env, LC_ALL: 'C', TZ: 'UTC' } },
  };
}

export default getProcessStartTimeCommand;
