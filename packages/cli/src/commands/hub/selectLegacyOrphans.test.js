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

import selectLegacyOrphans from './selectLegacyOrphans.js';

const START = 'Fri Sep 25 10:00:00 2026';

function proc(pid, ppid, command) {
  return { pid, ppid, processStartTime: START, command };
}

// A vitest harness's leaked e2e server: harness gone, wrappers reparented to PID 1.
const leakedChain = [
  proc(1, 0, '/sbin/launchd'),
  proc(100, 1, 'node /usr/local/lib/node_modules/pnpm/bin/pnpm.cjs exec lowdefy start --port 3111'),
  proc(101, 100, 'node /work/app/node_modules/.bin/../lowdefy/dist/index.js start --port 3111'),
  proc(102, 101, 'node src/index.js'),
];
const leakedCwds = new Map([[102, '/work/deleted-worktree/app/.lowdefy/server']]);

function select({
  processes = leakedChain,
  cwds = leakedCwds,
  registered = [],
  hub = [],
  platform = 'darwin',
} = {}) {
  return selectLegacyOrphans({
    processes,
    cwds,
    registeredPids: new Set(registered),
    hubPids: new Set(hub),
    platform,
  });
}

test('selectLegacyOrphans matches a leaked server whose wrappers lead to PID 1', () => {
  expect(select()).toEqual([
    {
      pid: 102,
      processStartTime: START,
      kind: 'server',
      cwd: '/work/deleted-worktree/app/.lowdefy/server',
      wrappers: [leakedChain[2].command, leakedChain[1].command],
      reaper: 'pid 1',
    },
  ]);
});

test('selectLegacyOrphans matches a leaked Playwright chain through sh -c and the standalone pnpm', () => {
  const processes = [
    proc(1, 0, '/sbin/launchd'),
    proc(200, 1, '/bin/sh -c lowdefy build --server e2e && lowdefy start --port 3001'),
    proc(201, 200, '/Users/dev/Library/pnpm/@pnpm/exe/pnpm exec lowdefy start'),
    proc(202, 201, 'node /repo/packages/cli/dist/index.js start --port 3001'),
    proc(203, 202, '/opt/node/bin/node src/index.js'),
  ];
  const cwds = new Map([[203, '/repo/_server/e2e/blocks-basic']]);
  expect(select({ processes, cwds }).map((orphan) => orphan.pid)).toEqual([203]);
});

test('selectLegacyOrphans matches a dev manager under npx and infisical run', () => {
  const processes = [
    proc(1, 0, '/sbin/launchd'),
    proc(300, 1, 'infisical run -- npx lowdefy dev'),
    proc(301, 300, 'node /home/dev/.npm/_npx/abc/node_modules/.bin/npx lowdefy dev'),
    proc(302, 301, 'node /home/dev/.npm/_npx/abc/node_modules/lowdefy/dist/index.js dev'),
    proc(303, 302, 'node manager/run.mjs'),
  ];
  const cwds = new Map([[303, '/home/dev/app/.lowdefy/dev']]);
  expect(select({ processes, cwds })).toMatchObject([{ pid: 303, kind: 'dev' }]);
});

test('selectLegacyOrphans skips the same chain under an interactive shell', () => {
  const processes = [
    proc(1, 0, '/sbin/launchd'),
    proc(90, 1, '/Applications/Utilities/Terminal.app/Contents/MacOS/Terminal'),
    proc(99, 90, '-zsh'),
    ...leakedChain.slice(1).map((entry) => (entry.pid === 100 ? { ...entry, ppid: 99 } : entry)),
  ];
  expect(select({ processes })).toEqual([]);
});

test('selectLegacyOrphans skips the same chain under an editor terminal', () => {
  const processes = [
    proc(1, 0, '/sbin/launchd'),
    proc(80, 1, '/Applications/Visual Studio Code.app/Contents/MacOS/Electron'),
    ...leakedChain.slice(1).map((entry) => (entry.pid === 100 ? { ...entry, ppid: 80 } : entry)),
  ];
  expect(select({ processes })).toEqual([]);
});

test('selectLegacyOrphans skips a server started by the hub, even after the hub restarted', () => {
  // The hub's process group leader, reparented to PID 1 when the old hub exited.
  expect(select({ hub: [100] })).toEqual([]);
  const underHub = [
    proc(1, 0, '/sbin/launchd'),
    proc(50, 1, 'node /usr/local/bin/lowdefy hub serve'),
    ...leakedChain.slice(1).map((entry) => (entry.pid === 100 ? { ...entry, ppid: 50 } : entry)),
  ];
  expect(select({ processes: underHub })).toEqual([]);
});

test('selectLegacyOrphans skips a registered server', () => {
  expect(select({ registered: [102] })).toEqual([]);
});

test('selectLegacyOrphans skips a server whose cwd is not a Lowdefy server directory', () => {
  expect(select({ cwds: new Map([[102, '/work/some-other-node-app']]) })).toEqual([]);
  expect(select({ cwds: new Map() })).toEqual([]);
});

test('selectLegacyOrphans skips other node processes', () => {
  const processes = [proc(1, 0, '/sbin/launchd'), proc(400, 1, 'node src/server.js')];
  const cwds = new Map([[400, '/work/app/.lowdefy/server']]);
  expect(select({ processes, cwds })).toEqual([]);
});

test('selectLegacyOrphans matches a Linux chain ending at systemd --user', () => {
  const processes = [
    proc(1, 0, '/sbin/init'),
    proc(10, 1, '/lib/systemd/systemd --user'),
    ...leakedChain.slice(1).map((entry) => (entry.pid === 100 ? { ...entry, ppid: 10 } : entry)),
  ];
  expect(select({ processes, platform: 'linux' })).toMatchObject([
    { pid: 102, reaper: 'systemd --user' },
  ]);
  expect(select({ processes, platform: 'darwin' })).toEqual([]);
});

test('selectLegacyOrphans finds nothing on Windows', () => {
  expect(select({ platform: 'win32' })).toEqual([]);
});
