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

import createViewRouter from '@lowdefy/client/adapters/createViewRouter.js';
import createViewBridge from '@lowdefy/client/host/createViewBridge.js';
import createViewHost from '@lowdefy/client/host/createViewHost.js';
import createFakeViewLoader from '@lowdefy/client/test/createFakeViewLoader.js';
import { vi, afterEach, beforeEach, expect, test } from 'vitest';

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
  globalThis.fetch = vi.fn();
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

// A page shown as an MCP App view: the frame is on another origin than the app, which is
// https://app.example.com/base here.
function createView() {
  const view = createFakeViewLoader({ basePath: '/base', path: '/tickets/12' });
  const frameFetch = vi.fn();
  const host = createViewHost({
    bridge: createViewBridge({ view }),
    router: createViewRouter({ basePath: '/base', path: '/tickets/12' }),
    window: { document: {}, fetch: frameFetch, location: {}, WebSocket: function WebSocket() {} },
  });
  return { frameFetch, host, view };
}

test('createLogUsage in a view posts usage to the app with the bearer session', async () => {
  const { frameFetch, host } = createView();
  frameFetch.mockResolvedValueOnce({ ...jsonResponse({ offline: true }), status: 200 });
  await createLogUsage({ host, usageDataRef })();
  expect(frameFetch).toHaveBeenCalledTimes(1);
  expect(globalThis.fetch).not.toHaveBeenCalled();
  const [url, init] = frameFetch.mock.calls[0];
  expect(url).toBe('https://app.example.com/base/api/usage');
  expect(init.method).toBe('POST');
  expect(init.headers).toEqual({
    'Content-Type': 'application/json',
    Authorization: 'Bearer token-1',
  });
  expect(JSON.parse(init.body)).toEqual({ user: { id: 'u1' }, machine: expect.any(String) });
});

test('createLogUsage in a view keeps the machine id in the store of the host, not localStorage', async () => {
  const { frameFetch, host } = createView();
  const setItem = vi.spyOn(globalThis.localStorage, 'setItem');
  const getItem = vi.spyOn(globalThis.localStorage, 'getItem');
  frameFetch.mockResolvedValue({ ...jsonResponse({ offline: true }), status: 200 });
  await createLogUsage({ host, usageDataRef })();
  const machine = host.storage.get('lowdefy_machine_id');
  expect(machine).toEqual(expect.any(String));
  expect(JSON.parse(frameFetch.mock.calls[0][1].body).machine).toBe(machine);
  expect(setItem).not.toHaveBeenCalled();
  expect(getItem).not.toHaveBeenCalled();
  // The view keeps the id for as long as it lives: a callback made again reads it back.
  await createLogUsage({ host, usageDataRef })();
  expect(JSON.parse(frameFetch.mock.calls[1][1].body).machine).toBe(machine);
});

test('createLogUsage in a view sends the call again with a new session after a 401', async () => {
  const { frameFetch, host, view } = createView();
  frameFetch
    .mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({ ...jsonResponse({ offline: true }), status: 200 });
  await createLogUsage({ host, usageDataRef })();
  expect(frameFetch).toHaveBeenCalledTimes(2);
  expect(frameFetch.mock.calls[1][1].headers.Authorization).toBe('Bearer token-2');
  expect(view.host.callServerTool).toHaveBeenCalledTimes(2);
});
