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
import net from 'net';
import os from 'os';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { wait } from '@lowdefy/helpers';

import createHubClient from './createHubClient.js';
import getHubPaths from './getHubPaths.js';

jest.setTimeout(30000);

const cliEntry = fileURLToPath(new URL('../../index.js', import.meta.url));

let home;
let hubs;
const originalHome = process.env.LOWDEFY_HOME;

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// A socket file with nothing listening, as a crash or a reboot leaves it.
function leaveStaleSocket(socketPath) {
  spawnSync(process.execPath, [
    '-e',
    `require('net').createServer().listen(${JSON.stringify(
      socketPath
    )}, () => process.kill(process.pid, 'SIGKILL'))`,
  ]);
}

function helloPid(socketPath) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(socketPath);
    socket.once('error', reject);
    socket.once('connect', async () => {
      const client = createHubClient({ socket });
      const { pid } = await client.request('hello');
      client.close();
      resolve(pid);
    });
  });
}

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hub-serve-'));
  hubs = [];
});

afterEach(() => {
  hubs.filter((hub) => isAlive(hub.pid)).forEach((hub) => hub.kill('SIGKILL'));
  if (originalHome === undefined) {
    delete process.env.LOWDEFY_HOME;
  } else {
    process.env.LOWDEFY_HOME = originalHome;
  }
  fs.rmSync(home, { recursive: true, force: true });
});

test('hubs started together against a stale socket leave exactly one hub, the one the socket reaches', async () => {
  const env = { ...process.env, LOWDEFY_HOME: home };
  process.env.LOWDEFY_HOME = home;
  const { hubDirectory, socketPath } = getHubPaths();
  fs.mkdirSync(hubDirectory, { recursive: true });
  leaveStaleSocket(socketPath);
  expect(fs.existsSync(socketPath)).toBe(true);

  hubs = Array.from({ length: 8 }).map(() =>
    spawn(process.execPath, [cliEntry, 'hub', 'serve'], { env, stdio: 'ignore' })
  );
  const deadline = Date.now() + 10000;
  while (hubs.filter((hub) => isAlive(hub.pid)).length > 1 && Date.now() < deadline) {
    await wait(100);
  }
  await wait(500);
  const alive = hubs.filter((hub) => isAlive(hub.pid)).map((hub) => hub.pid);
  expect(alive).toHaveLength(1);
  expect(await helloPid(socketPath)).toEqual(alive[0]);
});
