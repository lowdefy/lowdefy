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

import { EventEmitter } from 'node:events';

import { jest } from '@jest/globals';

const mockSpawn = jest.fn();
jest.unstable_mockModule('child_process', () => ({ spawn: mockSpawn }));
jest.unstable_mockModule('../utils/readBasePath.mjs', () => ({ default: () => '' }));

const { default: startServer } = await import('./startServer.mjs');

function createContext({ mailSink }) {
  return {
    bin: { vite: 'vite.js' },
    directories: { config: '/apps/tenant' },
    instance: { update: jest.fn() },
    internalPort: 3211,
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn() },
    mailSink,
    options: { port: 3210 },
    serverArtifacts: { record: jest.fn() },
    shutdownServer: jest.fn(),
    version: '7.2.0',
  };
}

beforeEach(() => {
  mockSpawn.mockImplementation(() =>
    Object.assign(new EventEmitter(), { stderr: new EventEmitter() })
  );
  process.env.LOWDEFY_DEV_SMTP_PORT = '2525';
});

afterEach(() => {
  delete process.env.LOWDEFY_DEV_SMTP_PORT;
  delete process.env.BETTER_AUTH_URL;
});

test.each([
  ['tells the child a mail sink listens when the manager started one', {}, 'true'],
  // The port alone, e.g. added to .env after start, starts no sink.
  ['tells the child nothing when no sink listens, even with the port set', null, undefined],
])('startServer %s', (_, mailSink, expected) => {
  startServer(createContext({ mailSink }));

  const { env } = mockSpawn.mock.calls[0][2];
  expect(env.LOWDEFY_SERVER_DEV_MAIL_SINK).toBe(expected);
  expect(env.LOWDEFY_DEV_SMTP_PORT).toBe('2525');
});

test('startServer moves a localhost BETTER_AUTH_URL onto the public dev port, and says so once', () => {
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  const context = createContext({ mailSink: null });

  startServer(context);
  startServer(context);

  const { env } = mockSpawn.mock.calls[0][2];
  expect(env.BETTER_AUTH_URL).toBe('http://localhost:3210');
  expect(mockSpawn.mock.calls[1][2].env.BETTER_AUTH_URL).toBe('http://localhost:3210');
  expect(context.logger.info).toHaveBeenCalledTimes(1);
  expect(context.logger.info.mock.calls[0][0]).toContain('http://localhost:3210');
});

test('startServer passes a non-loopback BETTER_AUTH_URL through', () => {
  process.env.BETTER_AUTH_URL = 'https://dev.example.ngrok.app';
  const context = createContext({ mailSink: null });

  startServer(context);

  expect(mockSpawn.mock.calls[0][2].env.BETTER_AUTH_URL).toBe('https://dev.example.ngrok.app');
  expect(context.logger.info).not.toHaveBeenCalled();
});

test('startServer leaves BETTER_AUTH_URL unset when none is configured', () => {
  startServer(createContext({ mailSink: null }));

  expect(mockSpawn.mock.calls[0][2].env.BETTER_AUTH_URL).toBeUndefined();
});

test('startServer holds the child stdin and tells it to exit when the pipe closes', () => {
  process.env.LOWDEFY_EXIT_WITH_PID = '4242';
  process.env.LOWDEFY_SERVER_REGISTRY_DIR = '/home/dev/.lowdefy/servers';
  try {
    startServer(createContext({ mailSink: null }));
  } finally {
    delete process.env.LOWDEFY_EXIT_WITH_PID;
    delete process.env.LOWDEFY_SERVER_REGISTRY_DIR;
  }

  const { env, stdio } = mockSpawn.mock.calls[0][2];
  expect(stdio[0]).toBe('pipe');
  expect(env.LOWDEFY_EXIT_ON_STDIN_CLOSE).toBe('1');
  expect(env.LOWDEFY_EXIT_WITH_PID).toBeUndefined();
  expect(env.LOWDEFY_SERVER_REGISTRY_DIR).toBeUndefined();
});

test('startServer tells the child the Lowdefy version it reports to MCP clients', () => {
  startServer(createContext({ mailSink: null }));

  expect(mockSpawn.mock.calls[0][2].env.LOWDEFY_SERVER_DEV_VERSION).toBe('7.2.0');
});
