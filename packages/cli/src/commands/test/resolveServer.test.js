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

import path from 'path';
import { vi, afterEach, beforeEach, expect, test } from 'vitest';

const mockReadDevInstance = vi.fn();
vi.doMock('@lowdefy/node-utils', () => ({ readDevInstance: mockReadDevInstance }));

const mockStartDevServer = vi.fn();
vi.doMock('./startDevServer.js', () => ({ default: mockStartDevServer }));

const { default: resolveServer } = await import('./resolveServer.js');

const configDirectory = path.join(process.cwd(), 'apps', 'foo');
let context;
let logs;

beforeEach(() => {
  logs = { info: [], warn: [], error: [] };
  context = {
    directories: { config: configDirectory },
    options: {},
    commandLineOptions: {},
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
      error: (line) => logs.error.push(line),
    },
  };
  mockReadDevInstance.mockReset();
  mockStartDevServer.mockReset();
  mockStartDevServer.mockResolvedValue({ url: 'http://localhost:3228', stop: vi.fn() });
});

afterEach(() => {
  vi.useRealTimers();
});

const ready = { state: 'ready', url: 'http://localhost:3100/app' };
const starting = { state: 'starting', url: 'http://localhost:3100/app' };

test('resolveServer runs against --url without reading or starting a dev server', async () => {
  context.options.url = 'http://localhost:4000/';
  const server = await resolveServer({ context });
  expect(server.url).toEqual('http://localhost:4000');
  expect(mockReadDevInstance).not.toHaveBeenCalled();
  expect(mockStartDevServer).not.toHaveBeenCalled();
  await server.stop();
  expect(logs.info).toEqual(['Running tests against http://localhost:4000/.']);
});

test('resolveServer reuses a ready dev server and says its use is not measured', async () => {
  mockReadDevInstance.mockReturnValue(ready);
  const server = await resolveServer({ context });
  expect(server.url).toEqual(ready.url);
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.warn).toEqual([]);
  await server.stop();
  expect(logs.info).toEqual([
    'Running tests against the running dev server at http://localhost:3100/app.',
    'Resources: not measured (shared dev server).',
  ]);
});

test('resolveServer warns about each option a reused server ignores', async () => {
  mockReadDevInstance.mockReturnValue(ready);
  context.commandLineOptions = { refResolver: 'resolver.js' };
  await resolveServer({ context });
  context.commandLineOptions = {
    refResolver: 'resolver.js',
    port: '3005',
    devDirectory: 'dev',
    serverDirectory: 'srv',
  };
  await resolveServer({ context });
  expect(logs.warn).toEqual([
    'Using the running dev server at http://localhost:3100/app; --ref-resolver does not apply to it. Stop it to run with these options.',
    'Using the running dev server at http://localhost:3100/app; --ref-resolver, --port, --dev-directory, --server-directory do not apply to it. Stop it to run with these options.',
  ]);
});

test('resolveServer does not warn about the default port or lowdefy.yaml cli options', async () => {
  mockReadDevInstance.mockReturnValue(ready);
  // getOptions always sets a port, and merges lowdefy.yaml's cli options in.
  context.options = { port: 3000, refResolver: 'resolver.js' };
  context.commandLineOptions = { logLevel: 'info' };
  await resolveServer({ context });
  expect(logs.warn).toEqual([]);
});

test('resolveServer starts its own server when none runs, or the record is in another state', async () => {
  mockReadDevInstance.mockReturnValue(null);
  expect((await resolveServer({ context })).url).toEqual('http://localhost:3228');
  mockReadDevInstance.mockReturnValue({ state: 'stopping', url: 'http://localhost:3100' });
  expect((await resolveServer({ context })).url).toEqual('http://localhost:3228');
  expect(mockStartDevServer).toHaveBeenCalledTimes(2);
  expect(mockStartDevServer).toHaveBeenCalledWith({ context });
});

test('resolveServer waits for a server that is still starting and uses it once ready', async () => {
  mockReadDevInstance
    .mockReturnValueOnce(starting)
    .mockReturnValueOnce({ state: 'starting' })
    .mockReturnValueOnce(starting)
    .mockReturnValue(ready);
  const ping = vi.fn(async () => false);
  const server = await resolveServer({ context, pollIntervalMs: 1, ping });
  expect(server.url).toEqual(ready.url);
  expect(mockStartDevServer).not.toHaveBeenCalled();
  // A record with no url yet is not pinged.
  expect(ping.mock.calls).toEqual([[starting.url]]);
  expect(logs.info[0]).toEqual('Waiting for the dev server in this worktree to finish starting.');
});

test('resolveServer takes a starting server whose ping answers as ready', async () => {
  mockReadDevInstance.mockReturnValue(starting);
  const ping = vi.fn(async () => true);
  const server = await resolveServer({ context, pollIntervalMs: 1, ping });
  expect(server.url).toEqual(starting.url);
  expect(mockStartDevServer).not.toHaveBeenCalled();
});

test('resolveServer starts its own server when the starting one goes away', async () => {
  mockReadDevInstance.mockReturnValueOnce(starting).mockReturnValue(null);
  const server = await resolveServer({ context, pollIntervalMs: 1, ping: async () => false });
  expect(server.url).toEqual('http://localhost:3228');
  expect(mockStartDevServer).toHaveBeenCalledTimes(1);
});

test('resolveServer fails when a starting server is not ready within 5 minutes', async () => {
  vi.useFakeTimers();
  mockReadDevInstance.mockReturnValue(starting);
  const resolving = resolveServer({ context, ping: async () => false });
  const failed = expect(resolving).rejects.toThrow(
    'The dev server in this worktree did not become ready. See: lowdefy hub logs apps/foo'
  );
  await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1000);
  await failed;
  expect(mockStartDevServer).not.toHaveBeenCalled();
});

test('resolveServer logs the output of a server that failed to start', async () => {
  mockReadDevInstance.mockReturnValue(null);
  mockStartDevServer.mockRejectedValue(
    Object.assign(new Error('boot failed'), { serverOutput: ['line 1', 'line 2'] })
  );
  await expect(resolveServer({ context })).rejects.toThrow('boot failed');
  expect(logs.error).toEqual(['line 1', 'line 2']);
});
