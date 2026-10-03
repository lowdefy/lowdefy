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

import parsePsStartTime from './parsePsStartTime.js';
import parseWmiStartTime from './parseWmiStartTime.js';

// A pid alone does not identify a process: after a reboot, or enough churn,
// the pid in a record can belong to something else entirely. The pid plus its
// start time does.
//
// Start times are compared as absolute instants, never as local time: hubs,
// shims and CLIs run with the time zone and locale of whichever session
// started them, and a time zone or daylight saving change must not turn one
// process into another - a hub would drop, orphaning, every server it should
// adopt.
//
// This is the command for macOS and Windows. Linux reads /proc instead
// (readLinuxProcessStartTime): its ps derives lstart from the wall clock.
//
// macOS: ps prints lstart in the caller's time zone and locale, so both are
// pinned (C, UTC) and the text is read as UTC. The kernel keeps the start as
// an absolute time, so a clock step does not move it.
//
// Windows has no ps. WMI's creation time comes as its raw CIM_DATETIME, which
// carries its own UTC offset (Get-WmiObject; Get-CimInstance would hand back a
// DateTime already moved into the local zone). PowerShell takes a few hundred
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
        `$p = Get-WmiObject -Class Win32_Process -Filter 'ProcessId = ${pid}'; if ($p) { $p.CreationDate }`,
      ],
      options: { windowsHide: true, timeout: 15000 },
      parse: parseWmiStartTime,
    };
  }
  return {
    command: 'ps',
    args: ['-o', 'lstart=', '-p', String(pid)],
    options: { env: { ...process.env, LC_ALL: 'C', TZ: 'UTC' } },
    parse: parsePsStartTime,
  };
}

export default getProcessStartTimeCommand;
