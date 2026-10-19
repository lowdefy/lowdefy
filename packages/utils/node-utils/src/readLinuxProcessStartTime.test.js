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
import os from 'os';
import path from 'path';

import getProcessStartTime from './getProcessStartTime.js';
import readLinuxProcessStartTime from './readLinuxProcessStartTime.js';

const BOOT_ID = '3f2b8c1e-5d4a-4f6b-9c7d-0e1f2a3b4c5d';

let procDirectory;

// /proc/<pid>/stat as the kernel writes it; field 22 is the start in clock ticks since boot.
function writeStat({ pid, command = 'node', ticks }) {
  fs.mkdirSync(path.join(procDirectory, String(pid)), { recursive: true });
  fs.writeFileSync(
    path.join(procDirectory, String(pid), 'stat'),
    `${pid} (${command}) S 1 ${pid} ${pid} 0 -1 4194560 1000 0 0 0 10 5 0 0 20 0 11 0 ${ticks} 123456789 2000 18446744073709551615\n`
  );
}

function writeBootId(bootId) {
  fs.mkdirSync(path.join(procDirectory, 'sys', 'kernel', 'random'), { recursive: true });
  fs.writeFileSync(path.join(procDirectory, 'sys', 'kernel', 'random', 'boot_id'), `${bootId}\n`);
}

// btime is the wall clock minus the time since boot, so a clock step moves it.
function writeBootTime(btime) {
  fs.writeFileSync(
    path.join(procDirectory, 'stat'),
    `cpu  100 0 100 1000 0 0 0 0 0 0\nbtime ${btime}\nprocesses 4242\n`
  );
}

beforeEach(() => {
  procDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-proc-'));
  writeBootId(BOOT_ID);
  writeBootTime(1790000000);
});

afterEach(() => {
  fs.rmSync(procDirectory, { recursive: true, force: true });
});

test('readLinuxProcessStartTime reads the boot id and the start in clock ticks since boot', () => {
  writeStat({ pid: 4242, ticks: 987654 });
  expect(readLinuxProcessStartTime({ pid: 4242, procDirectory })).toEqual(
    `linux:${BOOT_ID}:987654`
  );
});

test('readLinuxProcessStartTime reads the same start time after the wall clock is stepped', () => {
  writeStat({ pid: 4242, ticks: 987654 });
  const before = readLinuxProcessStartTime({ pid: 4242, procDirectory });
  // An NTP step, or WSL catching up after the host slept, moves btime and with it every
  // process's ps lstart.
  [1790000001, 1789999999, 1790000000 + 45 * 60].forEach((btime) => {
    writeBootTime(btime);
    expect(readLinuxProcessStartTime({ pid: 4242, procDirectory })).toEqual(before);
  });
});

test('readLinuxProcessStartTime tells processes on the same pid apart across a reboot', () => {
  writeStat({ pid: 4242, ticks: 987654 });
  const before = readLinuxProcessStartTime({ pid: 4242, procDirectory });
  writeBootId('8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d');
  expect(readLinuxProcessStartTime({ pid: 4242, procDirectory })).not.toEqual(before);
});

test('readLinuxProcessStartTime reads field 22 when the command name holds spaces and parentheses', () => {
  writeStat({ pid: 4242, command: 'evil) S 1 2 3 4 (name', ticks: 555 });
  expect(readLinuxProcessStartTime({ pid: 4242, procDirectory })).toEqual(`linux:${BOOT_ID}:555`);
});

test('readLinuxProcessStartTime returns null for a process that is not running', () => {
  expect(readLinuxProcessStartTime({ pid: 4242, procDirectory })).toBeNull();
});

test('readLinuxProcessStartTime returns null when the boot id cannot be read', () => {
  writeStat({ pid: 4242, ticks: 987654 });
  fs.rmSync(path.join(procDirectory, 'sys'), { recursive: true });
  expect(readLinuxProcessStartTime({ pid: 4242, procDirectory })).toBeNull();
});

test('readLinuxProcessStartTime returns null when the stat line is cut short', () => {
  fs.mkdirSync(path.join(procDirectory, '4242'));
  fs.writeFileSync(path.join(procDirectory, '4242', 'stat'), '4242 (node) S 1 4242');
  expect(readLinuxProcessStartTime({ pid: 4242, procDirectory })).toBeNull();
});

test('readLinuxProcessStartTime throws for a pid that is not a positive integer', () => {
  [undefined, null, 0, -1, 1.5, '4242', '../self'].forEach((pid) => {
    expect(() => readLinuxProcessStartTime({ pid, procDirectory })).toThrow(
      `Process id must be a positive integer. Received ${JSON.stringify(pid)}.`
    );
  });
});

const onLinux = process.platform === 'linux' ? test : test.skip;

onLinux('getProcessStartTime reads the start time from /proc on Linux', () => {
  const startTime = getProcessStartTime({ pid: process.pid });
  expect(startTime).toMatch(/^linux:[0-9a-f-]+:\d+$/);
  expect(readLinuxProcessStartTime({ pid: process.pid })).toEqual(startTime);
});
