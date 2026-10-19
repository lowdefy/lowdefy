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

import selectOrphanedClis from './selectOrphanedClis.js';

// Epoch milliseconds.
const CLI_START = 1790000000000;

// pgid defaults to a leader that is not in the table: the spawner that was killed.
function proc(pid, ppid, command, processStartTime = CLI_START, pgid = 50) {
  return { pid, ppid, pgid, processStartTime, command };
}

function record({ owner = {}, ownerAlive = true } = {}) {
  return {
    pid: 102,
    processStartTime: 1789999990000,
    kind: 'server',
    owner: { pid: 101, processStartTime: CLI_START, via: 'cli', ...owner },
    ownerAlive,
    prunable: !ownerAlive,
  };
}

const CLI = 'node /work/app/node_modules/.bin/../lowdefy/dist/index.js start --port 3111';

// `pnpm exec lowdefy start` whose pnpm was SIGKILLed: the CLI now sits under PID 1.
const orphanedCli = [
  proc(1, 0, '/sbin/launchd'),
  proc(101, 1, CLI),
  proc(102, 101, 'node src/index.js'),
];

function select({
  processes = orphanedCli,
  records = [record()],
  hub = [],
  platform = 'darwin',
} = {}) {
  return selectOrphanedClis({ processes, records, hubPids: new Set(hub), platform });
}

test('selectOrphanedClis matches a registered server whose live CLI sits directly under PID 1', () => {
  expect(select()).toEqual([{ record: record(), cliPid: 101, wrappers: [], reaper: 'pid 1' }]);
});

test('selectOrphanedClis matches a CLI whose remaining ancestors are only wrappers', () => {
  const processes = [
    proc(1, 0, '/sbin/launchd'),
    proc(90, 1, '/bin/sh -c pnpm exec lowdefy start --port 3111'),
    proc(100, 90, '/Users/dev/Library/pnpm/@pnpm/exe/pnpm exec lowdefy start --port 3111'),
    proc(101, 100, CLI),
    proc(102, 101, 'node src/index.js'),
  ];
  expect(select({ processes })).toMatchObject([{ cliPid: 101, reaper: 'pid 1' }]);
});

test('selectOrphanedClis skips a CLI whose process group leader is alive, as a service runs it', () => {
  const asLaunchdService = [
    proc(1, 0, '/sbin/launchd', CLI_START, 1),
    proc(101, 1, CLI, CLI_START, 101),
    proc(102, 101, 'node src/index.js', CLI_START, 101),
  ];
  expect(select({ processes: asLaunchdService })).toEqual([]);
  const underServiceWrapper = [
    proc(1, 0, '/sbin/launchd', CLI_START, 1),
    proc(100, 1, '/usr/local/bin/pnpm exec lowdefy start --port 3111', CLI_START, 100),
    proc(101, 100, CLI, CLI_START, 100),
    proc(102, 101, 'node src/index.js', CLI_START, 100),
  ];
  expect(select({ processes: underServiceWrapper })).toEqual([]);
});

test('selectOrphanedClis skips a CLI started from a terminal shell', () => {
  const processes = [
    proc(1, 0, '/sbin/launchd'),
    proc(80, 1, '/Applications/Utilities/Terminal.app/Contents/MacOS/Terminal'),
    proc(99, 80, '-zsh'),
    proc(101, 99, CLI),
    proc(102, 101, 'node src/index.js'),
  ];
  expect(select({ processes })).toEqual([]);
});

test('selectOrphanedClis skips a CLI under a running harness', () => {
  const processes = [
    proc(1, 0, '/sbin/launchd'),
    proc(70, 1, 'node node_modules/vitest/vitest.mjs run'),
    proc(101, 70, CLI),
    proc(102, 101, 'node src/index.js'),
  ];
  expect(select({ processes })).toEqual([]);
});

test('selectOrphanedClis skips a dev server the hub started, also after a hub restart', () => {
  const processes = [
    proc(1, 0, '/sbin/launchd'),
    proc(60, 1, 'npm run dev'),
    proc(101, 60, 'node /work/app/node_modules/.bin/../lowdefy/dist/index.js dev'),
    proc(102, 101, 'node manager/run.mjs'),
  ];
  expect(select({ processes, hub: [60] })).toEqual([]);
});

test('selectOrphanedClis skips records whose owner is gone, named by pid, or not a lowdefy CLI', () => {
  expect(select({ records: [record({ ownerAlive: false })] })).toEqual([]);
  expect(select({ records: [record({ owner: { via: 'exit-with-pid' } })] })).toEqual([]);
  const notCli = [proc(1, 0, '/sbin/launchd'), proc(101, 1, 'node some-other-script.js')];
  expect(select({ processes: notCli })).toEqual([]);
});

test('selectOrphanedClis skips an owner pid now held by another process', () => {
  const reused = [proc(1, 0, '/sbin/launchd'), proc(101, 1, CLI, CLI_START + 60000)];
  expect(select({ processes: reused })).toEqual([]);
});

test('selectOrphanedClis skips an owner whose start time an older Lowdefy recorded as local time', () => {
  expect(
    select({ records: [record({ owner: { processStartTime: 'Fri Oct  2 21:00:00 2026' } })] })
  ).toEqual([]);
});

test('selectOrphanedClis finds nothing on Windows', () => {
  expect(select({ platform: 'win32' })).toEqual([]);
});
