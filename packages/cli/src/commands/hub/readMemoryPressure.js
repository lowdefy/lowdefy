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
import { execFileSync } from 'child_process';

const MACOS_LEVELS = { 1: 'normal', 2: 'warn', 4: 'critical' };

// Percent of the last 10 s in which some (warn) or all (critical) runnable
// tasks were stalled waiting on memory.
const PSI_THRESHOLD = 10;

function readMacosPressure({ exec }) {
  const level = exec('sysctl', ['-n', 'kern.memorystatus_vm_pressure_level']).trim();
  return MACOS_LEVELS[level] ?? 'normal';
}

function readPsiAvg10({ text, kind }) {
  const line = text.split('\n').find((candidate) => candidate.startsWith(`${kind} `));
  const match = /avg10=([0-9.]+)/.exec(line ?? '');
  return match === null ? 0 : Number(match[1]);
}

function readLinuxPressure({ readFile, psiPath }) {
  const text = readFile(psiPath);
  if (readPsiAvg10({ text, kind: 'full' }) >= PSI_THRESHOLD) {
    return 'critical';
  }
  if (readPsiAvg10({ text, kind: 'some' }) >= PSI_THRESHOLD) {
    return 'warn';
  }
  return 'normal';
}

function execText(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// The operating system's own memory pressure level: 'normal', 'warn' or
// 'critical'. Free memory is not a gauge - macOS keeps it near zero by design
// (it read 167 MB on a machine with a quarter of its memory available) - so
// the hub reads the level the kernel itself acts on. Where there is none
// (Windows, Linux without PSI) or it cannot be read, pressure is 'normal' and
// only the plain idle limit applies.
function readMemoryPressure({
  platform = process.platform,
  exec = execText,
  readFile = readText,
  psiPath = '/proc/pressure/memory',
} = {}) {
  try {
    if (platform === 'darwin') {
      return readMacosPressure({ exec });
    }
    if (platform === 'linux') {
      return readLinuxPressure({ readFile, psiPath });
    }
  } catch {
    // Unreadable is treated as no pressure.
  }
  return 'normal';
}

export default readMemoryPressure;
