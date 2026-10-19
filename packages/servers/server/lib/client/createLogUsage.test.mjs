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

import createLogUsage from './createLogUsage.js';

const usageDataRef = { current: { user: { id: 'u1' } } };

function jsonResponse(body) {
  return { ok: true, json: async () => body };
}

beforeEach(() => {
  const stored = {};
  globalThis.localStorage = {
    getItem: (key) => stored[key] ?? null,
    setItem: (key, value) => {
      stored[key] = value;
    },
  };
  globalThis.fetch = jest.fn();
});

afterEach(() => {
  delete globalThis.localStorage;
  delete globalThis.fetch;
});

test.each([
  { basePath: '', url: '/api/usage' },
  { basePath: '/app', url: '/app/api/usage' },
])('createLogUsage posts usage to $url', async ({ basePath, url }) => {
  globalThis.fetch.mockResolvedValueOnce(jsonResponse({ offline: true }));
  await createLogUsage({ basePath, usageDataRef })();
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(globalThis.fetch.mock.calls[0][0]).toBe(url);
});

test.each([
  {
    name: 'an HTML page instead of JSON',
    response: {
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON at position 0');
      },
    },
  },
  { name: 'an error status', response: { ok: false, json: async () => ({}) } },
])('createLogUsage drops a usage route answering with $name', async ({ response }) => {
  globalThis.fetch.mockResolvedValueOnce(response);
  await expect(createLogUsage({ basePath: '', usageDataRef })()).resolves.toBeUndefined();
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
});

test('createLogUsage drops a failed telemetry post', async () => {
  globalThis.fetch
    .mockResolvedValueOnce(jsonResponse({ offline: false, data: { machine: 'm' } }))
    .mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(createLogUsage({ basePath: '', usageDataRef })()).resolves.toBeUndefined();
  expect(globalThis.fetch).toHaveBeenCalledTimes(2);
});

test('createLogUsage works when browser storage throws', async () => {
  globalThis.localStorage = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('SecurityError');
    },
  };
  globalThis.fetch.mockResolvedValueOnce(jsonResponse({ offline: true }));
  await createLogUsage({ basePath: '', usageDataRef })();
  expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body).machine).toEqual(expect.any(String));
});
