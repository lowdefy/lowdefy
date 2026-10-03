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
import path from 'path';
import { type } from '@lowdefy/helpers';

const TICKS = /^\d+$/;
const BOOT_ID = /^[0-9a-f-]+$/;

// The kernel keeps a process's start as clock ticks since boot (/proc/<pid>/stat field 22),
// which nothing moves. ps lstart adds those ticks to the boot time in /proc/stat, which the
// kernel derives from the wall clock, so stepping the clock (an NTP step, a manual date, WSL
// catching up after the host slept) moves every process's lstart and makes a live process
// read as another one. Ticks count from boot, so the boot id goes with them: after a reboot
// the same ticks can name another process.
//
// "linux:<boot id>:<ticks>", or null when the process is gone or /proc cannot be read.
function readLinuxProcessStartTime({ pid, procDirectory = '/proc' }) {
  // The pid is written into a path.
  if (!type.isInt(pid) || pid <= 0) {
    throw new Error(`Process id must be a positive integer. Received ${JSON.stringify(pid)}.`);
  }
  let stat;
  let bootId;
  try {
    stat = fs.readFileSync(path.join(procDirectory, String(pid), 'stat'), 'utf8');
    bootId = fs
      .readFileSync(path.join(procDirectory, 'sys', 'kernel', 'random', 'boot_id'), 'utf8')
      .trim();
  } catch {
    return null;
  }
  // Field 2, the command name, is in parentheses and may itself hold spaces and parentheses.
  // The fields after the last ")" are separated by single spaces, starting at field 3.
  const commandEnd = stat.lastIndexOf(')');
  if (commandEnd === -1) {
    return null;
  }
  const ticks = stat
    .slice(commandEnd + 1)
    .trim()
    .split(' ')[22 - 3];
  if (!TICKS.test(ticks ?? '') || !BOOT_ID.test(bootId)) {
    return null;
  }
  return `linux:${bootId}:${ticks}`;
}

export default readLinuxProcessStartTime;
