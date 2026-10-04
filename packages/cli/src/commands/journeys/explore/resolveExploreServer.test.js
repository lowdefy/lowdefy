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

import resolveExploreServer from './resolveExploreServer.js';
import waitForDevInstance from './waitForDevInstance.js';

const mockReadDevInstance = jest.fn();

function wait({ configDirectory }) {
  return waitForDevInstance({ configDirectory, read: mockReadDevInstance, pollIntervalMs: 1 });
}

function createContext() {
  return {
    directories: { config: '/apps/crm' },
    logger: { info: jest.fn(), error: jest.fn() },
  };
}

afterEach(() => {
  mockReadDevInstance.mockReset();
});

test('a starting dev instance record is waited on until ready, and no second server is started', async () => {
  const records = [
    { state: 'starting', url: null },
    { state: 'starting', url: null },
    { state: 'ready', url: 'http://localhost:3111' },
  ];
  mockReadDevInstance.mockImplementation(() => records.shift() ?? null);
  const start = jest.fn();
  const server = await resolveExploreServer({ context: createContext(), url: null, start, wait });
  expect(server.url).toBe('http://localhost:3111');
  expect(start).not.toHaveBeenCalled();
});

test('with no dev server running or starting, the explorer starts its own headless one', async () => {
  mockReadDevInstance.mockReturnValue(null);
  const started = { url: 'http://localhost:3112', stop: jest.fn() };
  const start = jest.fn(async () => started);
  expect(await resolveExploreServer({ context: createContext(), url: null, start, wait })).toBe(
    started
  );
});

test('--url is used as given, without a trailing slash', async () => {
  const server = await resolveExploreServer({
    context: createContext(),
    url: 'http://localhost:3111/',
    start: jest.fn(),
    wait,
  });
  expect(server.url).toBe('http://localhost:3111');
  expect(mockReadDevInstance).not.toHaveBeenCalled();
});

test('waitForDevInstance gives up on a record that errors or never becomes ready', async () => {
  expect(
    await waitForDevInstance({ configDirectory: '/x', read: () => ({ state: 'error' }) })
  ).toBe(null);
  expect(
    await waitForDevInstance({
      configDirectory: '/x',
      read: () => ({ state: 'starting' }),
      pollIntervalMs: 5,
      timeoutMs: 30,
    })
  ).toBe(null);
});
