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
import os from 'os';
import path from 'path';
import { wait } from '@lowdefy/helpers';

import createHub from './createHub.js';

jest.setTimeout(30000);

// Stands in for `lowdefy dev`: writes the instance record the dev manager
// writes, spawns a grandchild (as the manager spawns Vite), and runs until
// signalled.
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
  configDirectory: fs.realpathSync('.'),
  owner: process.env.LOWDEFY_DEV_OWNER,
  state: 'ready',
  port,
  url: 'http://localhost:' + port,
  startedAt: new Date().toISOString(),
}));
console.log('fake dev server ready on ' + port + ' ' + process.env.FROM_REQUESTER);
setInterval(() => {}, 1000);
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

function createTestHub({ openTabs = async () => 0 } = {}) {
  return createHub({
    paths: { registryPath: path.join(home, 'hub', 'registry.json') },
    cliVersion: '6.0.0',
    logger: { info: () => {}, error: () => {} },
    openTabs,
    portRange,
  });
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

beforeEach(() => {
  home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hub-home-')));
  configDirectory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hub-app-')));
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
  fs.rmSync(home, { recursive: true, force: true });
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('hub start runs the dev script as its own process group, with a hub port and the requester env, and waits for ready', async () => {
  const status = await hub.start({
    configDirectory,
    env: { ...process.env, FROM_REQUESTER: 'requester-env' },
  });
  expect(status).toMatchObject({ configDirectory, owner: 'hub', state: 'ready', managed: true });
  expect(Number(new URL(status.url).port)).toBeGreaterThanOrEqual(portRange.first);
  expect(hub.logs({ configDirectory }).lines.join('\n')).toContain('requester-env');
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
  await wait(200);
  expect(isAlive(grandchild)).toBe(false);
});

test('hub restart keeps the port the app had', async () => {
  const first = await hub.start({ configDirectory });
  const restarted = await hub.start({ configDirectory, restart: true });
  expect(restarted.pid).not.toEqual(first.pid);
  expect(restarted.url).toEqual(first.url);
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

test('hub start reports the log tail when the dev script exits before it is ready', async () => {
  fs.writeFileSync(
    path.join(configDirectory, 'fake-dev.cjs'),
    'console.log("secrets login expired"); process.exit(1);'
  );
  const status = await hub.start({ configDirectory });
  expect(status.state).toEqual('exited');
  expect(status.logTail.join('\n')).toContain('secrets login expired');
});

test('a new hub adopts running servers from the registry and can stop them', async () => {
  await hub.start({ configDirectory });
  const adopting = createTestHub();
  expect(adopting.list().instances).toEqual([
    expect.objectContaining({ configDirectory, state: 'ready', managed: true }),
  ]);
  expect(await adopting.stop({ configDirectory })).toEqual({ stopped: true });
});

test('a registry entry whose pid now belongs to another process is dropped, never signalled', async () => {
  fs.mkdirSync(path.join(home, 'hub'), { recursive: true });
  fs.writeFileSync(
    path.join(home, 'hub', 'registry.json'),
    JSON.stringify({
      ports: {},
      instances: {
        [configDirectory]: { pid: process.pid, processStartTime: 'Thu Jan  1 00:00:00 1970' },
      },
    })
  );
  const adopting = createTestHub();
  expect(adopting.list().instances).toEqual([]);
  expect(isAlive(process.pid)).toBe(true);
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
  const deadline = Date.now() + 7000;
  while (isAlive(grandchild) && Date.now() < deadline) {
    await wait(100);
  }
  const survived = isAlive(grandchild);
  if (survived) {
    process.kill(grandchild, 'SIGKILL');
  }
  expect(survived).toBe(false);
});

test('hub reap stops a server whose worktree was removed, though the server recreates its .lowdefy', async () => {
  fs.appendFileSync(
    path.join(configDirectory, 'fake-dev.cjs'),
    `setInterval(() => {
  fs.mkdirSync('${configDirectory}/.lowdefy', { recursive: true });
  fs.writeFileSync('${configDirectory}/.lowdefy/building', 'false');
}, 50);`
  );
  await hub.start({ configDirectory });
  const grandchild = Number(fs.readFileSync(path.join(configDirectory, 'grandchild.pid'), 'utf8'));
  fs.rmSync(configDirectory, { recursive: true, force: true });
  await wait(200);
  expect(fs.existsSync(configDirectory)).toBe(true);

  await hub.reap();
  await wait(200);
  expect(isAlive(grandchild)).toBe(false);
  expect(hub.list().instances).toEqual([]);
});

test('hub reap releases the ports of an app that was removed after it stopped', async () => {
  await hub.start({ configDirectory });
  await hub.stop({ configDirectory });
  fs.rmSync(configDirectory, { recursive: true, force: true });
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

test.each([[0], [-5], [2.5], ['10'], [null]])('hub logs refuses lines %p', (lines) => {
  expect(() => hub.logs({ configDirectory, lines })).toThrow('"lines" must be a positive integer');
});
