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

import { jest } from '@jest/globals';
import fs from 'fs';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { wait } from '@lowdefy/helpers';
import { getProcessStartTime } from '@lowdefy/node-utils';

import createHub from './createHub.js';

// Longer than the hub's own 120 s wait for a server to be ready, so a dev
// script that starts slowly on a loaded machine gets the hub's answer, not a
// test timeout. How long anything takes is not under test here.
jest.setTimeout(150000);

// Stands in for `lowdefy dev`: writes the instance record the dev manager
// writes (its configDirectory the native realpath, as the manager records it),
// spawns a grandchild (as the manager spawns Vite), and runs until signalled.
const FAKE_DEV_SERVER = `
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
fs.writeFileSync('grandchild.pid', String(child.pid));
const port = Number(process.env.LOWDEFY_DEV_PORT);
fs.mkdirSync('.lowdefy', { recursive: true });
fs.writeFileSync(path.join('.lowdefy', 'instance.json'), JSON.stringify({
  pid: process.pid,
  configDirectory: fs.realpathSync.native('.'),
  owner: process.env.LOWDEFY_DEV_OWNER,
  state: 'ready',
  port,
  url: 'http://localhost:' + port,
  startedAt: new Date().toISOString(),
}));
console.log('fake dev server ready on ' + port + ' ' + process.env.FROM_REQUESTER);
setInterval(() => {}, 1000);
`;

// A dev server that takes its time: it records its launch, says it is
// starting, and is ready only once the test writes a "go" file (or exits on a
// "die" file), so a test decides when its start slot frees.
const SLOW_DEV_SERVER = `
const fs = require('fs');
const path = require('path');
fs.appendFileSync('launches.log', process.pid + '\\n');
const port = Number(process.env.LOWDEFY_DEV_PORT);
function writeRecord(state) {
  fs.mkdirSync('.lowdefy', { recursive: true });
  fs.writeFileSync(path.join('.lowdefy', 'instance.json'), JSON.stringify({
    pid: process.pid,
    configDirectory: fs.realpathSync('.'),
    owner: process.env.LOWDEFY_DEV_OWNER,
    state,
    port,
    url: 'http://localhost:' + port,
    startedAt: new Date().toISOString(),
  }));
}
writeRecord('starting');
let ready = false;
setInterval(() => {
  if (fs.existsSync('die')) process.exit(1);
  if (!ready && fs.existsSync('go')) {
    ready = true;
    writeRecord('ready');
  }
}, 25);
`;

let home;
let configDirectory;
let portRange;
let hub;

// A range of its own for each test run, clear of the hub's real 4100-4999, so
// hubs and hub tests in other worktrees never take the ports a test expects.
function randomPortRange() {
  const first = 20000 + 2 * Math.floor(Math.random() * 15000);
  return { first, last: first + 40 };
}

function createTestHub({
  openTabs = async () => 0,
  readPressure = () => 'normal',
  ...options
} = {}) {
  return createHub({
    paths: { registryPath: path.join(home, 'hub', 'registry.json') },
    cliVersion: '6.0.0',
    logger: { info: () => {}, error: () => {} },
    openTabs,
    portRange,
    readPressure,
    ...options,
  });
}

let extraApps = [];

// Another app directory with the fake dev server, removed after the test.
function makeApp({ script = FAKE_DEV_SERVER } = {}) {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hub-app-')));
  fs.writeFileSync(path.join(directory, 'lowdefy.yaml'), 'lowdefy: 6.0.0\n');
  fs.writeFileSync(path.join(directory, 'fake-dev.cjs'), script);
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    JSON.stringify({ scripts: { dev: 'node fake-dev.cjs # lowdefy dev' } })
  );
  extraApps.push(directory);
  return directory;
}

// What the dev manager writes as it is used: merged into the instance record.
function writeActivity({ directory = configDirectory, idleMinutes, ...fields }) {
  const instancePath = path.join(directory, '.lowdefy', 'instance.json');
  const record = JSON.parse(fs.readFileSync(instancePath, 'utf8'));
  const lastActivityAt = new Date(Date.now() - idleMinutes * 60 * 1000).toISOString();
  fs.writeFileSync(
    instancePath,
    JSON.stringify({ ...record, lastActivityAt, activeRequests: 0, building: false, ...fields })
  );
}

function grandchildOf(directory) {
  return Number(fs.readFileSync(path.join(directory, 'grandchild.pid'), 'utf8'));
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// Processes stop, and files appear, some time after the call that causes
// them: poll for the outcome instead of sleeping a fixed time.
async function waitUntil(predicate, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (!(await predicate())) {
    if (Date.now() > deadline) {
      return false;
    }
    await wait(50);
  }
  return true;
}

beforeEach(() => {
  // The native realpath, as the dev manager records an app: on Windows
  // os.tmpdir() can be an 8.3 short path (RUNNER~1) that only the native call
  // expands, and a record naming the short path is not found.
  home = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hub-home-')));
  configDirectory = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hub-app-'))
  );
  fs.writeFileSync(path.join(configDirectory, 'lowdefy.yaml'), 'lowdefy: 6.0.0\n');
  fs.writeFileSync(path.join(configDirectory, 'fake-dev.cjs'), FAKE_DEV_SERVER);
  fs.writeFileSync(
    path.join(configDirectory, 'package.json'),
    JSON.stringify({ scripts: { dev: 'node fake-dev.cjs # lowdefy dev' } })
  );
  portRange = randomPortRange();
  hub = createTestHub();
});

afterEach(async () => {
  await hub.stop({ configDirectory }).catch(() => {});
  // Twice: stopping one app frees a slot a queued app may have launched into.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const directory of extraApps) {
      await hub.stop({ configDirectory: directory }).catch(() => {});
    }
  }
  extraApps.forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
  extraApps = [];
  // Windows keeps a killed process's handle on its working directory for a
  // moment; rmSync retries EPERM and EBUSY.
  fs.rmSync(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  fs.rmSync(configDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

const isWindows = process.platform === 'win32';
// On Windows the detached dev script's output does not reach .lowdefy/dev.log,
// so the hub has no log tail to report. Tracked as its own fix.
const withHubDevLog = isWindows ? test.skip : test;
// Windows refuses to delete a directory a live process runs in, so a worktree
// cannot be removed under a running server there.
const onPosix = isWindows ? test.skip : test;

test('hub start runs the dev script as its own process group, with a hub port, and waits for ready', async () => {
  const status = await hub.start({ configDirectory });
  expect(status).toMatchObject({ configDirectory, owner: 'hub', state: 'ready', managed: true });
  expect(Number(new URL(status.url).port)).toBeGreaterThanOrEqual(portRange.first);
});

withHubDevLog('hub start runs the dev script with the requester env', async () => {
  await hub.start({
    configDirectory,
    env: { ...process.env, FROM_REQUESTER: 'requester-env' },
  });
  expect((await hub.logs({ configDirectory })).lines.join('\n')).toContain('requester-env');
});

test('hub start returns the running server instead of starting a second one', async () => {
  const first = await hub.start({ configDirectory });
  const second = await hub.start({ configDirectory });
  expect(second.pid).toEqual(first.pid);
});

test('hub stop stops the whole process group, grandchildren included', async () => {
  await hub.start({ configDirectory });
  const grandchild = Number(fs.readFileSync(path.join(configDirectory, 'grandchild.pid'), 'utf8'));
  expect(isAlive(grandchild)).toBe(true);

  expect(await hub.stop({ configDirectory })).toEqual({ stopped: true });
  expect(await waitUntil(() => !isAlive(grandchild))).toBe(true);
});

test('hub restart keeps the port the app had', async () => {
  const first = await hub.start({ configDirectory });
  const restarted = await hub.start({ configDirectory, restart: true });
  // The whole answer, so a restart that did not come up shows its state and log tail.
  expect(restarted).toMatchObject({ state: 'ready', url: first.url });
  expect(restarted.pid).not.toEqual(first.pid);
});

test('hub refuses to stop a dev server it did not start', async () => {
  fs.mkdirSync(path.join(configDirectory, '.lowdefy'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, '.lowdefy', 'instance.json'),
    JSON.stringify({ pid: process.pid, configDirectory, owner: 'terminal', state: 'ready' })
  );
  const result = await hub.stop({ configDirectory });
  expect(result.stopped).toBe(false);
  expect(result.reason).toContain('not started by the hub');
  expect(isAlive(process.pid)).toBe(true);
});

withHubDevLog(
  'hub start reports the log tail when the dev script exits before it is ready',
  async () => {
    fs.writeFileSync(
      path.join(configDirectory, 'fake-dev.cjs'),
      'console.log("secrets login expired"); process.exit(1);'
    );
    const status = await hub.start({ configDirectory });
    expect(status.state).toEqual('exited');
    expect(status.logTail.join('\n')).toContain('secrets login expired');
  }
);

test('a new hub adopts running servers from the registry and can stop them', async () => {
  await hub.start({ configDirectory });
  const adopting = createTestHub();
  expect((await adopting.list()).instances).toEqual([
    expect.objectContaining({ configDirectory, state: 'ready', managed: true }),
  ]);
  expect(await adopting.stop({ configDirectory })).toEqual({ stopped: true });
});

// A start time in the form this platform reads, but not the one the pid's process has: on
// Linux, the same ticks in another boot.
function otherStartTime(pid) {
  const startTime = getProcessStartTime({ pid });
  if (typeof startTime === 'string') {
    return startTime.replace(/^linux:[^:]+:/, 'linux:00000000-0000-0000-0000-000000000000:');
  }
  return 0;
}

test('a registry entry whose pid now belongs to another process is dropped, never signalled', async () => {
  fs.mkdirSync(path.join(home, 'hub'), { recursive: true });
  fs.writeFileSync(
    path.join(home, 'hub', 'registry.json'),
    JSON.stringify({
      ports: {},
      instances: {
        [configDirectory]: { pid: process.pid, processStartTime: otherStartTime(process.pid) },
      },
    })
  );
  const adopting = createTestHub();
  expect((await adopting.list()).instances).toEqual([]);
  expect(isAlive(process.pid)).toBe(true);
});

test.each([
  ['without a start time', null],
  ['with a start time an older hub wrote as local time', 'Thu Jan  1 00:00:00 1970'],
])('a registry entry written %s is adopted by its pid', async (_, processStartTime) => {
  const leader = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    detached: true,
    stdio: 'ignore',
  });
  try {
    fs.mkdirSync(path.join(home, 'hub'), { recursive: true });
    fs.writeFileSync(
      path.join(home, 'hub', 'registry.json'),
      JSON.stringify({
        ports: {},
        instances: { [configDirectory]: { pid: leader.pid, processStartTime } },
      })
    );
    const adopting = createTestHub();
    expect((await adopting.list()).instances).toEqual([
      expect.objectContaining({ configDirectory, managed: true }),
    ]);
  } finally {
    leader.kill('SIGKILL');
  }
});

test('concurrent starts for one app launch one dev server and leave none unmanaged', async () => {
  fs.writeFileSync(
    path.join(configDirectory, 'fake-dev.cjs'),
    `require('fs').appendFileSync('launches.log', process.pid + '\\n');\n${FAKE_DEV_SERVER}`
  );
  const [first, second] = await Promise.all([
    hub.start({ configDirectory }),
    hub.start({ configDirectory }),
  ]);
  const launches = fs.readFileSync(path.join(configDirectory, 'launches.log'), 'utf8');
  expect(launches.trim().split('\n')).toHaveLength(1);
  expect(second.pid).toEqual(first.pid);
  expect(first.managed).toBe(true);
});

test('a dev server that exits on its own leaves no process of its group behind', async () => {
  // A manager killed outright (out of memory, kill -9) leaves Vite running in
  // the group, holding the app's internal port.
  fs.writeFileSync(
    path.join(configDirectory, 'fake-dev.cjs'),
    `const { spawn } = require('child_process');
const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
require('fs').writeFileSync('grandchild.pid', String(child.pid));
process.exit(1);`
  );
  const status = await hub.start({ configDirectory });
  expect(status.state).toEqual('exited');
  const grandchild = Number(fs.readFileSync(path.join(configDirectory, 'grandchild.pid'), 'utf8'));
  const survived = !(await waitUntil(() => !isAlive(grandchild)));
  if (survived) {
    process.kill(grandchild, 'SIGKILL');
  }
  expect(survived).toBe(false);
});

onPosix(
  'hub reap stops a server whose worktree was removed on the second pass that finds it gone',
  async () => {
    fs.appendFileSync(
      path.join(configDirectory, 'fake-dev.cjs'),
      `setInterval(() => {
  fs.mkdirSync(${JSON.stringify(path.join(configDirectory, '.lowdefy'))}, { recursive: true });
  fs.writeFileSync(${JSON.stringify(path.join(configDirectory, '.lowdefy', 'building'))}, 'false');
}, 50);`
    );
    await hub.start({ configDirectory });
    const grandchild = Number(
      fs.readFileSync(path.join(configDirectory, 'grandchild.pid'), 'utf8')
    );
    fs.rmSync(configDirectory, { recursive: true, force: true });
    expect(await waitUntil(() => fs.existsSync(configDirectory))).toBe(true);

    // The server recreates .lowdefy, and one pass may see a checkout switching
    // branches: the first pass that finds lowdefy.yaml gone keeps the server.
    await hub.reap();
    expect(isAlive(grandchild)).toBe(true);
    await hub.reap();
    expect(await waitUntil(() => !isAlive(grandchild))).toBe(true);
    expect((await hub.list()).instances).toEqual([]);
  }
);

test('hub reap keeps a server whose lowdefy.yaml was missing for one pass only', async () => {
  await hub.start({ configDirectory });
  const lowdefyYaml = path.join(configDirectory, 'lowdefy.yaml');
  fs.renameSync(lowdefyYaml, `${lowdefyYaml}.moved`);
  await hub.reap();
  fs.renameSync(`${lowdefyYaml}.moved`, lowdefyYaml);
  await hub.reap();
  await hub.reap();
  expect((await hub.list()).instances).toEqual([expect.objectContaining({ state: 'ready' })]);
});

test('hub reap releases the ports of an app that was removed after it stopped', async () => {
  await hub.start({ configDirectory });
  await hub.stop({ configDirectory });
  fs.rmSync(configDirectory, { recursive: true, force: true });
  await hub.reap();
  await hub.reap();
  const registry = JSON.parse(fs.readFileSync(path.join(home, 'hub', 'registry.json'), 'utf8'));
  expect(registry.ports).toEqual({});
});

test('overlapping reaps share one pass, so a slow open-tabs check is not repeated', async () => {
  await hub.start({ configDirectory });
  // Make the server look idle past the reap limit, then adopt it.
  const registryPath = path.join(home, 'hub', 'registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  registry.instances[configDirectory].startedAt = new Date(0).toISOString();
  fs.writeFileSync(registryPath, JSON.stringify(registry));
  const openTabs = jest.fn(async () => {
    await wait(200);
    return 1;
  });
  const adopting = createTestHub({ openTabs });
  await Promise.all([adopting.reap(), adopting.reap()]);
  expect(openTabs).toHaveBeenCalledTimes(1);
});

test.each([[0], [-5], [2.5], ['10'], [null]])('hub logs refuses lines %p', async (lines) => {
  await expect(hub.logs({ configDirectory, lines })).rejects.toThrow(
    '"lines" must be a positive integer'
  );
});

test('hub reap stops a server unused for the idle limit, though an agent session is still attached', async () => {
  await hub.start({ configDirectory });
  hub.attach({ connectionId: 1, configDirectory });
  writeActivity({ idleMinutes: 16 });
  const grandchild = grandchildOf(configDirectory);

  await hub.reap();

  expect(await waitUntil(() => !isAlive(grandchild))).toBe(true);
  expect((await hub.list()).instances).toEqual([]);
});

test.each([
  ['a request is in flight', { idleMinutes: 16, activeRequests: 1 }],
  ['a build is running', { idleMinutes: 16, building: true }],
  ['it is still starting', { idleMinutes: 16, state: 'starting' }],
  ['it was used 14 minutes ago', { idleMinutes: 14 }],
])('hub reap keeps a server when %s', async (_, activity) => {
  await hub.start({ configDirectory });
  writeActivity(activity);
  await hub.reap();
  expect((await hub.list()).instances).toEqual([expect.objectContaining({ configDirectory })]);
});

test('hub reap stops a server stuck starting past the start hold once unused for the idle limit', async () => {
  await hub.start({ configDirectory });
  writeActivity({
    idleMinutes: 16,
    state: 'starting',
    startedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  });
  const grandchild = grandchildOf(configDirectory);

  await hub.reap();

  expect(await waitUntil(() => !isAlive(grandchild))).toBe(true);
  expect((await hub.list()).instances).toEqual([]);
});

test.each([
  ['a request begins', { idleMinutes: 16, activeRequests: 1 }],
  ['it is used', { idleMinutes: 0 }],
])('hub reap keeps a server judged idle when %s during the tab poll', async (_, activity) => {
  await hub.start({ configDirectory });
  writeActivity({ idleMinutes: 16 });
  const openTabs = jest.fn(async () => {
    writeActivity(activity);
    return 0;
  });
  const adopting = createTestHub({ openTabs });

  await adopting.reap();

  expect(openTabs).toHaveBeenCalledTimes(1);
  expect((await adopting.list()).instances).toEqual([expect.objectContaining({ configDirectory })]);
});

test('hub reap keeps a server restarted during the tab poll', async () => {
  await hub.start({ configDirectory });
  writeActivity({ idleMinutes: 16 });
  let restarting;
  const adopting = createTestHub({
    openTabs: async () => {
      // The restart's stop and launch are queued ahead of the reap's stop, and
      // the new server has not written its record when the reap's turn comes.
      restarting = adopting.start({ configDirectory, restart: true });
      return 0;
    },
  });

  // The restarted server is the adopting hub's, so the clean-up stops it there.
  hub = adopting;

  await adopting.reap();

  expect((await restarting).state).toBe('ready');
  expect((await adopting.list()).instances).toEqual([expect.objectContaining({ configDirectory })]);
});

test('hub reap keeps an unused server that a browser tab has open', async () => {
  await hub.start({ configDirectory });
  writeActivity({ idleMinutes: 60 });
  const openTabs = jest.fn(async () => 1);
  const adopting = createTestHub({ openTabs });
  await adopting.reap();
  expect(openTabs).toHaveBeenCalledTimes(1);
  expect((await adopting.list()).instances).toEqual([expect.objectContaining({ configDirectory })]);
});

test.each([
  ['warn', 6],
  ['critical', 3],
])(
  'hub reap at %s memory pressure stops a server unused for %i minutes',
  async (pressure, idleMinutes) => {
    await hub.start({ configDirectory });
    writeActivity({ idleMinutes });
    const keeping = createTestHub();
    await keeping.reap();
    expect((await keeping.list()).instances).toHaveLength(1);

    const pressured = createTestHub({ readPressure: () => pressure });
    await pressured.reap();
    expect((await pressured.list()).instances).toEqual([]);
  }
);

test('hub reap keeps the attachment rule for a server whose record has no activity fields', async () => {
  await hub.start({ configDirectory });
  hub.attach({ connectionId: 1, configDirectory });
  // Started long ago, by the registry's account.
  const registryPath = path.join(home, 'hub', 'registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  registry.instances[configDirectory].startedAt = new Date(0).toISOString();
  fs.writeFileSync(registryPath, JSON.stringify(registry));
  const adopting = createTestHub();
  adopting.attach({ connectionId: 1, configDirectory });

  await adopting.reap();
  expect((await adopting.list()).instances).toHaveLength(1);

  adopting.connectionClosed({ connectionId: 1 });
  await adopting.reap();
  expect((await adopting.list()).instances).toHaveLength(1);
});

test.each([
  ['warn', true],
  ['normal', false],
])(
  'a start at %s memory pressure with 4 servers running reaps idle servers first: %p',
  async (pressure, reaped) => {
    let currentPressure = 'normal';
    hub = createTestHub({ readPressure: () => currentPressure });
    await hub.start({ configDirectory });
    for (let i = 0; i < 3; i += 1) {
      await hub.start({ configDirectory: makeApp() });
    }
    // Idle past the warn limit but not the normal one.
    writeActivity({ idleMinutes: 6 });
    const grandchild = grandchildOf(configDirectory);

    currentPressure = pressure;
    await hub.start({ configDirectory: makeApp() });

    if (reaped) {
      expect(await waitUntil(() => !isAlive(grandchild))).toBe(true);
    } else {
      expect(isAlive(grandchild)).toBe(true);
    }
    expect((await hub.list()).instances).toHaveLength(reaped ? 4 : 5);
  }
);

function makeSlowApp() {
  return makeApp({ script: SLOW_DEV_SERVER });
}

function launchCount(directory) {
  const logPath = path.join(directory, 'launches.log');
  if (!fs.existsSync(logPath)) {
    return 0;
  }
  return fs.readFileSync(logPath, 'utf8').trim().split('\n').length;
}

function markReady(directory) {
  fs.writeFileSync(path.join(directory, 'go'), '');
}

test('hub launches two apps at once and queues the rest in order until a slot frees', async () => {
  const [a, b, c, d] = [makeSlowApp(), makeSlowApp(), makeSlowApp(), makeSlowApp()];
  const starts = [a, b, c, d].map((directory) => hub.start({ configDirectory: directory }));
  expect(await waitUntil(() => launchCount(a) === 1 && launchCount(b) === 1)).toBe(true);
  expect(
    await waitUntil(async () => (await hub.status({ configDirectory: d })).state === 'queued')
  ).toBe(true);

  expect(await hub.status({ configDirectory: c })).toMatchObject({ state: 'queued', ahead: 0 });
  expect(await hub.status({ configDirectory: d })).toMatchObject({ state: 'queued', ahead: 1 });
  expect(launchCount(c)).toBe(0);

  markReady(a);
  expect(await waitUntil(() => launchCount(c) === 1)).toBe(true);
  expect(await hub.status({ configDirectory: d })).toMatchObject({ state: 'queued', ahead: 0 });

  [b, c, d].forEach(markReady);
  const statuses = await Promise.all(starts);
  expect(statuses.map((status) => status.state)).toEqual(['ready', 'ready', 'ready', 'ready']);
  expect([a, b, c, d].map(launchCount)).toEqual([1, 1, 1, 1]);
});

test('a start slot frees when its server exits before it is ready', async () => {
  const [a, b, c] = [makeSlowApp(), makeSlowApp(), makeSlowApp()];
  [a, b, c].forEach((directory) => hub.start({ configDirectory: directory }));
  expect(
    await waitUntil(async () => (await hub.status({ configDirectory: c })).state === 'queued')
  ).toBe(true);

  fs.writeFileSync(path.join(a, 'die'), '');
  expect(await waitUntil(() => launchCount(c) === 1)).toBe(true);
});

test('a start slot frees once a server has held it for the hold limit', async () => {
  hub = createTestHub({ startSlotHoldMs: 500 });
  const [a, b, c] = [makeSlowApp(), makeSlowApp(), makeSlowApp()];
  [a, b, c].forEach((directory) => hub.start({ configDirectory: directory }));
  expect(
    await waitUntil(async () => (await hub.status({ configDirectory: c })).state === 'queued')
  ).toBe(true);

  expect(await waitUntil(() => launchCount(c) === 1)).toBe(true);
  expect((await hub.status({ configDirectory: a })).state).toBe('starting');
});

test('stopping another app is not held up by starts waiting for a slot', async () => {
  await hub.start({ configDirectory });
  const [a, b, c] = [makeSlowApp(), makeSlowApp(), makeSlowApp()];
  [a, b, c].forEach((directory) => hub.start({ configDirectory: directory }));
  expect(
    await waitUntil(async () => (await hub.status({ configDirectory: c })).state === 'queued')
  ).toBe(true);

  const stopped = Date.now();
  expect(await hub.stop({ configDirectory })).toEqual({ stopped: true });
  expect(Date.now() - stopped).toBeLessThan(5000);
  expect((await hub.status({ configDirectory: c })).state).toBe('queued');
});

test('two starts for one queued app share its place and launch it once', async () => {
  const [a, b, c, d] = [makeSlowApp(), makeSlowApp(), makeSlowApp(), makeSlowApp()];
  [a, b].forEach((directory) => hub.start({ configDirectory: directory }));
  expect(await waitUntil(() => launchCount(a) === 1 && launchCount(b) === 1)).toBe(true);
  const firstC = hub.start({ configDirectory: c });
  hub.start({ configDirectory: d });
  const secondC = hub.start({ configDirectory: c });
  expect(
    await waitUntil(async () => (await hub.status({ configDirectory: d })).state === 'queued')
  ).toBe(true);
  expect(await hub.status({ configDirectory: d })).toMatchObject({ ahead: 1 });

  [a, b, c].forEach(markReady);
  expect((await firstC).state).toBe('ready');
  expect((await secondC).state).toBe('ready');
  expect(launchCount(c)).toBe(1);
});

test('stopping a queued app takes it off the queue and it never launches', async () => {
  const [a, b, c] = [makeSlowApp(), makeSlowApp(), makeSlowApp()];
  [a, b].forEach((directory) => hub.start({ configDirectory: directory }));
  const queuedStart = hub.start({ configDirectory: c });
  expect(
    await waitUntil(async () => (await hub.status({ configDirectory: c })).state === 'queued')
  ).toBe(true);

  expect(await hub.stop({ configDirectory: c })).toEqual({ stopped: true });
  expect((await queuedStart).state).toBe('stopped');
  [a, b].forEach(markReady);
  await waitUntil(async () => (await hub.status({ configDirectory: b })).state === 'ready');
  await wait(1500);
  expect(launchCount(c)).toBe(0);
});

test('at critical memory pressure one server launches at a time', async () => {
  hub = createTestHub({ readPressure: () => 'critical' });
  const [a, b] = [makeSlowApp(), makeSlowApp()];
  [a, b].forEach((directory) => hub.start({ configDirectory: directory }));
  expect(
    await waitUntil(async () => (await hub.status({ configDirectory: b })).state === 'queued')
  ).toBe(true);
  expect(launchCount(b)).toBe(0);

  markReady(a);
  expect(await waitUntil(() => launchCount(b) === 1)).toBe(true);
});

test('a restart takes a start slot like a first start', async () => {
  await hub.start({ configDirectory });
  const [a, b] = [makeSlowApp(), makeSlowApp()];
  [a, b].forEach((directory) => hub.start({ configDirectory: directory }));
  expect(await waitUntil(() => launchCount(a) === 1 && launchCount(b) === 1)).toBe(true);

  const restart = hub.start({ configDirectory, restart: true });
  expect(
    await waitUntil(async () => (await hub.status({ configDirectory })).state === 'queued')
  ).toBe(true);
  markReady(a);
  expect((await restart).state).toBe('ready');
});

test('a start still queued at its deadline answers queued, and calling again keeps its place', async () => {
  hub = createTestHub({ readyTimeoutMs: 1000 });
  const [a, b, c, d] = [makeSlowApp(), makeSlowApp(), makeSlowApp(), makeSlowApp()];
  [a, b].forEach((directory) => hub.start({ configDirectory: directory }));
  expect(await waitUntil(() => launchCount(a) === 1 && launchCount(b) === 1)).toBe(true);

  const [first] = await Promise.all([
    hub.start({ configDirectory: c }),
    hub.start({ configDirectory: d }),
  ]);
  expect(first).toMatchObject({ state: 'queued', ahead: 0 });
  expect(first.note).toContain('Queued behind 2 other starts on this machine.');
  expect(first.note).toContain('your place is kept');

  expect(await hub.start({ configDirectory: c })).toMatchObject({ state: 'queued', ahead: 0 });
  expect(await hub.status({ configDirectory: d })).toMatchObject({ state: 'queued', ahead: 1 });
});

test('a new hub counts an adopted server that is still starting as holding a start slot', async () => {
  const [a, b, c] = [makeSlowApp(), makeSlowApp(), makeSlowApp()];
  hub.start({ configDirectory: a });
  expect(await waitUntil(() => launchCount(a) === 1)).toBe(true);

  const adopting = createTestHub();
  try {
    adopting.start({ configDirectory: b });
    adopting.start({ configDirectory: c });
    expect(
      await waitUntil(
        async () => (await adopting.status({ configDirectory: c })).state === 'queued'
      )
    ).toBe(true);
    expect(await waitUntil(() => launchCount(b) === 1)).toBe(true);
    expect(launchCount(c)).toBe(0);
  } finally {
    for (const directory of [c, b]) {
      await adopting.stop({ configDirectory: directory });
    }
  }
});
