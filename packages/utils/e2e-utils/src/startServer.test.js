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

import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

const mockSpawn = jest.fn();
const mockIsPortAvailable = jest.fn();
jest.unstable_mockModule('child_process', () => ({ spawn: mockSpawn }));
jest.unstable_mockModule('@lowdefy/node-utils/isPortAvailable.js', () => ({
  default: mockIsPortAvailable,
}));

const { default: startServer } = await import('./startServer.js');

const realKill = process.kill;
const realFetch = global.fetch;
let signals;
let children;

const isWindows = process.platform === 'win32';

function receiveSignal({ pid, signal }) {
  signals.push({ pid, signal });
  const child = children.find((c) => c.pid === Math.abs(pid));
  if (child && (child.exitOnSignal || signal === 'SIGKILL')) {
    child.signalCode = signal;
    setImmediate(() => child.emit('exit', null, signal));
  }
}

// On POSIX stop() signals the server's process group (a negative pid); Windows has no process
// groups, so it signals the child itself.
function signalledPid(child) {
  return isWindows ? child.pid : -child.pid;
}

function createChild({ exitOnSignal = true, exitCode } = {}) {
  const child = new EventEmitter();
  child.pid = 5000 + children.length;
  child.exitCode = null;
  child.signalCode = null;
  child.exitOnSignal = exitOnSignal;
  child.kill = jest.fn((signal) => receiveSignal({ pid: child.pid, signal }));
  if (exitCode !== undefined) {
    setImmediate(() => {
      child.exitCode = exitCode;
      child.emit('exit', exitCode, null);
    });
  }
  children.push(child);
  return child;
}

beforeEach(() => {
  signals = [];
  children = [];
  mockSpawn.mockReset();
  mockIsPortAvailable.mockReset();
  mockIsPortAvailable.mockResolvedValue(true);
  process.kill = jest.fn((pid, signal) => receiveSignal({ pid, signal }));
  global.fetch = jest.fn().mockResolvedValue({ status: 200 });
});

afterEach(() => {
  process.kill = realKill;
  global.fetch = realFetch;
});

test('startServer refuses a port that is already in use', async () => {
  mockIsPortAvailable.mockResolvedValue(false);
  await expect(startServer({ appDir: '/apps/shop', port: 3191 })).rejects.toThrow(
    'Port 3191 is already in use.'
  );
  expect(mockSpawn).not.toHaveBeenCalled();
});

test('startServer requires a port', async () => {
  await expect(startServer({ appDir: '/apps/shop' })).rejects.toThrow(
    'startServer requires a port. Received undefined.'
  );
});

test('startServer builds, starts the server in its own group owned by this process, and returns once it answers', async () => {
  mockSpawn
    .mockImplementationOnce(() => createChild({ exitCode: 0 }))
    .mockImplementationOnce(() => createChild());

  const server = await startServer({
    appDir: '/apps/shop',
    port: 3191,
    env: { APP_SECRET: 'x' },
  });

  const [buildCommand, buildArgs, buildOptions] = mockSpawn.mock.calls[0];
  expect([path.basename(buildCommand), ...buildArgs]).toEqual([
    isWindows ? 'npx.cmd' : 'npx',
    'lowdefy',
    'build',
    '--server',
    'e2e',
  ]);
  expect(buildOptions.cwd).toEqual(path.resolve('/apps/shop'));

  const [, startArgs, startOptions] = mockSpawn.mock.calls[1];
  expect(startArgs).toEqual(['lowdefy', 'start', '--port', '3191', '--log-level', 'warn']);
  expect(startOptions.detached).toBe(process.platform !== 'win32');
  expect(startOptions.env.LOWDEFY_EXIT_WITH_PID).toEqual(String(process.pid));
  expect(startOptions.env.APP_SECRET).toEqual('x');
  expect(global.fetch.mock.calls[0][0]).toEqual('http://localhost:3191');
  expect(server.url).toEqual('http://localhost:3191');
  expect(server.port).toEqual(3191);

  await server.stop();
  expect(signals).toEqual([{ pid: signalledPid(children[1]), signal: 'SIGTERM' }]);
  await server.stop();
  expect(signals).toHaveLength(1);
});

test('startServer uses the app local lowdefy binary when installed', async () => {
  const appDir = fs.mkdtempSync(path.join(fs.realpathSync.native(os.tmpdir()), 'lowdefy-start-'));
  const binName = isWindows ? 'lowdefy.cmd' : 'lowdefy';
  fs.mkdirSync(path.join(appDir, 'node_modules', '.bin'), { recursive: true });
  fs.writeFileSync(path.join(appDir, 'node_modules', '.bin', binName), '');
  mockSpawn.mockImplementationOnce(() => createChild());
  try {
    const server = await startServer({ appDir, port: 3191, build: false });
    expect(mockSpawn.mock.calls[0][0]).toEqual(path.join(appDir, 'node_modules', '.bin', binName));
    expect(mockSpawn.mock.calls[0][1][0]).toEqual('start');
    await server.stop();
  } finally {
    fs.rmSync(appDir, { recursive: true, force: true });
  }
});

test('startServer throws when the build fails, starting nothing', async () => {
  mockSpawn.mockImplementationOnce(() => createChild({ exitCode: 1 }));
  await expect(startServer({ appDir: '/apps/shop', port: 3191 })).rejects.toThrow(
    'lowdefy build exited with code 1.'
  );
  expect(mockSpawn).toHaveBeenCalledTimes(1);
});

test('startServer throws when lowdefy start exits before the server answers', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
  mockSpawn.mockImplementationOnce(() => createChild({ exitCode: 1 }));
  await expect(startServer({ appDir: '/apps/shop', port: 3191, build: false })).rejects.toThrow(
    'lowdefy start exited with code 1 before the server was ready.'
  );
});

test('startServer stops the server group when it is not ready in time', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
  mockSpawn.mockImplementationOnce(() => createChild());
  await expect(
    startServer({ appDir: '/apps/shop', port: 3191, build: false, timeoutMs: 10 })
  ).rejects.toThrow('The server on port 3191 was not ready within 10ms.');
  expect(signals).toEqual([{ pid: signalledPid(children[0]), signal: 'SIGTERM' }]);
});

test('startServer stop escalates to SIGKILL when the server ignores SIGTERM', async () => {
  mockSpawn.mockImplementationOnce(() => createChild({ exitOnSignal: false }));
  const server = await startServer({
    appDir: '/apps/shop',
    port: 3191,
    build: false,
    stopGraceMs: 20,
  });
  await server.stop();
  expect(signals).toEqual([
    { pid: signalledPid(children[0]), signal: 'SIGTERM' },
    { pid: signalledPid(children[0]), signal: 'SIGKILL' },
  ]);
});
