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

const mockStartDevServer = jest.fn();
jest.unstable_mockModule('./startDevServer.js', () => ({ default: mockStartDevServer }));

const mockDetect = jest.fn();
jest.unstable_mockModule('./detectRunningDevServer.js', () => ({ default: mockDetect }));

const { default: resolveTestServer } = await import('./resolveTestServer.js');

let logs;
let context;

beforeEach(() => {
  logs = { info: [], warn: [], error: [] };
  context = {
    directories: { config: '/app', dev: '/app/.lowdefy/dev' },
    options: {},
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
      error: (line) => logs.error.push(line),
    },
  };
  mockStartDevServer.mockReset();
  mockStartDevServer.mockResolvedValue({ url: 'http://localhost:41234', stop: jest.fn() });
  mockDetect.mockReset();
  mockDetect.mockReturnValue({ running: false });
});

test('resolveTestServer uses --url without starting or detecting a server', async () => {
  context.options.url = 'http://localhost:3000/';
  const server = await resolveTestServer({ context });
  expect(server.url).toEqual('http://localhost:3000');
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockDetect).not.toHaveBeenCalled();
  expect(logs.info).toEqual(['Running against http://localhost:3000.']);
});

test('resolveTestServer drives the development server already running for the app', async () => {
  mockDetect.mockReturnValue({ running: true, pid: 55, url: 'http://localhost:3000' });
  const server = await resolveTestServer({ context });
  expect(server.url).toEqual('http://localhost:3000');
  expect(mockStartDevServer).not.toHaveBeenCalled();
  await server.stop();
  expect(logs.info).toEqual(['Running against the development server at http://localhost:3000.']);
});

test('resolveTestServer starts its own server when no development server is running', async () => {
  const server = await resolveTestServer({ context, env: { LOWDEFY_X: '1' } });
  expect(server.url).toEqual('http://localhost:41234');
  expect(mockStartDevServer).toHaveBeenCalledWith({ context, env: { LOWDEFY_X: '1' } });
});

test('resolveTestServer starts its own server when the run needs its own environment', async () => {
  mockDetect.mockReturnValue({ running: true, pid: 55, url: 'http://localhost:3000' });
  const server = await resolveTestServer({ context, reuseRunningServer: false });
  expect(server.url).toEqual('http://localhost:41234');
  expect(mockDetect).not.toHaveBeenCalled();
});

test('resolveTestServer warns and starts its own server when the lock records no port', async () => {
  mockDetect.mockReturnValue({ running: true, pid: 55 });
  await resolveTestServer({ context });
  expect(logs.warn).toEqual([
    'A development server (pid 55) is running for this app but does not record its port. Starting a separate server; pass --url to use the running one.',
  ]);
  expect(mockStartDevServer).toHaveBeenCalled();
});

test('resolveTestServer logs the captured server output when the boot fails', async () => {
  const error = new Error('Development server exited with code 1 before it was ready.');
  error.serverOutput = ['line one', 'line two'];
  mockStartDevServer.mockRejectedValue(error);
  await expect(resolveTestServer({ context })).rejects.toThrow(
    'Development server exited with code 1 before it was ready.'
  );
  expect(logs.error).toEqual(['line one', 'line two']);
});
