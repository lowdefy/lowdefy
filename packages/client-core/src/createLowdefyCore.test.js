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
import { callerHash, callerStamp } from '@lowdefy/helpers';

import createLowdefyCore, { HOST_KEYS } from './createLowdefyCore.js';
import createMemoryStore from './test/createMemoryStore.js';
import updateLowdefyPage from './updateLowdefyPage.js';

const userA = { id: 'user_a', organization_id: 'org_1', roles: ['editor'] };
const userB = { id: 'user_b', organization_id: 'org_1', roles: ['editor'] };

function response({ status = 200, body = {}, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name] ?? null },
    json: async () => body,
  };
}

function createFakeHost() {
  return {
    fetch: jest.fn(async () => response()),
    globals: {},
    onBuildChanged: jest.fn(),
    onCallerChanged: jest.fn(),
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    WebSocket: jest.fn(),
    websocketUrl: (path) => `wss://app.example.com${path}`,
  };
}

function createCore({ apiBase, basePath = '', host = createFakeHost(), user = userA } = {}) {
  const lowdefy = { buildId: 'build-1' };
  createLowdefyCore({
    apiBase,
    auth: { authConfig: {} },
    basePath,
    host,
    lowdefy,
    rootConfig: { lowdefyApp: { slug: 'sales' }, theme: { primary: 'blue' } },
    types: { actions: { A: 1 }, blocks: { B: 2 }, operators: { _o: 3 } },
  });
  updateLowdefyPage({
    config: {
      pageConfig: { pageId: 'home', path: 'home' },
      rootConfig: { home: { pageId: 'home' }, menus: [], pagePaths: { home: 'home' } },
    },
    lowdefy,
    matchedPath: 'home',
    pathParams: {},
    user,
  });
  return { host, lowdefy };
}

async function settles(promise) {
  const pending = Symbol('pending');
  const result = await Promise.race([
    promise,
    new Promise((r) => setTimeout(() => r(pending), 20)),
  ]);
  return result !== pending;
}

test('createLowdefyCore builds the request layer on the host fetch, with apiBase as the prefix', async () => {
  const { host, lowdefy } = createCore({ apiBase: 'https://app.example.com', basePath: '/crm' });
  await lowdefy._internal.callRequest({ pageId: 'home', requestId: 'list', payload: {} });
  await lowdefy._internal.callAPI({ endpointId: 'save', payload: {} });
  expect(host.fetch.mock.calls.map(([url]) => url)).toEqual([
    'https://app.example.com/api/request/home/list',
    'https://app.example.com/api/endpoints/save',
  ]);
  expect(host.fetch.mock.calls[0][1].headers['x-lowdefy-build']).toBe('build-1');
  expect(lowdefy.basePath).toBe('/crm');
});

test('createLowdefyCore defaults apiBase to basePath', () => {
  const { lowdefy } = createCore({ basePath: '/crm' });
  expect(lowdefy.apiBase).toBe('/crm');
});

test('a response stamped with another caller calls onCallerChanged with the stamp and never settles', async () => {
  const host = createFakeHost();
  const stamp = callerStamp({ user: userB });
  host.fetch.mockResolvedValue(response({ headers: { 'x-lowdefy-caller': stamp } }));
  const { lowdefy } = createCore({ host });
  const promise = lowdefy._internal.callRequest({ pageId: 'home', requestId: 'list' });
  expect(await settles(promise)).toBe(false);
  expect(host.onCallerChanged).toHaveBeenCalledTimes(1);
  expect(host.onCallerChanged.mock.calls[0][0].caller).toBe(callerHash({ user: userB }));
  expect(host.onBuildChanged).not.toHaveBeenCalled();
});

test('a response stamped with the rendered caller is kept as the last caller stamp', async () => {
  const host = createFakeHost();
  host.fetch.mockResolvedValue(
    response({ body: { ok: 1 }, headers: { 'x-lowdefy-caller': callerStamp({ user: userA }) } })
  );
  const { lowdefy } = createCore({ host });
  await expect(
    lowdefy._internal.callRequest({ pageId: 'home', requestId: 'list' })
  ).resolves.toEqual({ ok: 1 });
  expect(host.onCallerChanged).not.toHaveBeenCalled();
  expect(lowdefy._internal.callerStamp.caller).toBe(callerHash({ user: userA }));
});

test('a 409 from another build calls onBuildChanged once per build and never settles', async () => {
  const host = createFakeHost();
  host.fetch.mockResolvedValue(
    response({ status: 409, body: { name: 'UserError', message: 'Reload.', buildId: 'build-2' } })
  );
  const { lowdefy } = createCore({ host });
  const promise = lowdefy._internal.callAPI({ endpointId: 'save', payload: {} });
  expect(await settles(promise)).toBe(false);
  expect(host.onBuildChanged).toHaveBeenCalledWith({ serverBuildId: 'build-2' });
  // The same build again throws instead, so a host that stays on the old build cannot loop.
  await expect(lowdefy._internal.callAPI({ endpointId: 'save', payload: {} })).rejects.toThrow(
    'Reload.'
  );
  expect(host.onBuildChanged).toHaveBeenCalledTimes(1);
});

test('storage keys stay namespaced by app, base path and user, and other users keys are cleared', () => {
  const host = createFakeHost();
  host.storage.set('lowdefy:sales:/crm:lowdefy_user:user_b:views', '{}');
  host.storage.set('lowdefy:sales:/crm:lowdefy_darkMode', 'dark');
  host.storage.set('lowdefy:other::lowdefy_user:user_b:views', '{}');
  const { lowdefy } = createCore({ basePath: '/crm', host });
  expect(lowdefy._internal.storage.appKey('settings')).toBe('lowdefy:sales:/crm:settings');
  expect(lowdefy._internal.storage.userKey('views')).toBe(
    'lowdefy:sales:/crm:lowdefy_user:user_a:views'
  );
  expect(host.storage.keys().sort()).toEqual([
    'lowdefy:other::lowdefy_user:user_b:views',
    'lowdefy:sales:/crm:lowdefy_darkMode',
  ]);
});

test('the websocket client connects to the URL the host gives for apiBase', () => {
  const host = createFakeHost();
  const { lowdefy } = createCore({ apiBase: '/crm', host });
  lowdefy._internal.websocketClient.connect();
  expect(host.WebSocket).toHaveBeenCalledWith('wss://app.example.com/crm/api/websocket');
});

test('createLowdefyCore keeps the path memory and caller stamp when built again', () => {
  const { host, lowdefy } = createCore();
  const stamp = lowdefy._internal.callerStamp;
  lowdefy._internal.callerStamp = { caller: 'abc' };
  createLowdefyCore({
    auth: {},
    basePath: '',
    host,
    lowdefy,
    rootConfig: {},
    types: {},
  });
  expect(stamp).toBe(null);
  expect(lowdefy._internal.callerStamp).toEqual({ caller: 'abc' });
  expect([...lowdefy.pathMemory.keys()]).toEqual(['home']);
});

test('createLowdefyCore names every host member that is missing', () => {
  expect(() =>
    createLowdefyCore({
      basePath: '',
      host: { fetch: jest.fn(), router: {} },
      lowdefy: {},
      rootConfig: {},
      types: {},
    })
  ).toThrow(
    'Lowdefy client host is missing globals, onBuildChanged, onCallerChanged, sessionStorage, storage, WebSocket, websocketUrl.'
  );
  expect(HOST_KEYS).toContain('fetch');
});

test('createLowdefyCore throws when the host is not an object', () => {
  expect(() => createLowdefyCore({ basePath: '', lowdefy: {}, rootConfig: {}, types: {} })).toThrow(
    'Lowdefy client host is not an object. Received undefined.'
  );
});
