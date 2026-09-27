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
    logger: { debug: jest.fn(), error: jest.fn() },
    mailSink,
    options: { port: 3210 },
    shutdownServer: jest.fn(),
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
