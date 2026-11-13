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

import { expect, test, vi } from 'vitest';
import { fetch as expoFetch } from 'expo/fetch';

import createDevShellConfig from './createDevShellConfig.js';
import createFakeServer, { header } from '../../test/createFakeServer.js';
import createShellApp from '../../createShellApp.js';
import { createPages, createRoot } from '../../test/fixtures.js';

// createShellApp as the app runs it, over in-memory stores.
vi.mock('expo-sqlite', () => ({ openDatabaseSync: () => ({}) }));
vi.mock(
  '../../cache/createSqliteCacheStore.js',
  () => import('../../test/createMemoryCacheStore.js')
);
vi.mock('../../host/createDeviceStore.js', () => import('../../host/createMemoryStore.js'));
vi.mock('expo-secure-store', async () =>
  (await import('../../test/createFakeSecureStore.js')).default()
);
vi.mock('expo-crypto', () => ({ randomUUID: vi.fn() }));
vi.mock('expo-web-browser', () => ({}));
vi.mock('expo-local-authentication', () => ({}));
vi.mock('expo-network', () => ({ addNetworkStateListener: () => ({ remove: () => undefined }) }));
vi.mock('expo-router', () => ({ router: {} }));
vi.mock('expo-clipboard', () => ({}));
vi.mock('expo/fetch', () => ({
  fetch: vi.fn(async () => ({ status: 200, headers: { get: () => null } })),
}));

class FakeWebSocket {
  constructor(url, protocols, options) {
    this.options = options;
  }
}

const shell = {
  id: 'lowdefy-dev',
  environment: 'dev',
  profile: 'dev',
  scheme: 'lowdefy-dev',
  version: '7.0.0',
};

test('every call of an app on a paired dev server carries the pairing token', async () => {
  const server = createFakeServer({
    root: createRoot(),
    rootEtag: '"root-1"',
    pages: createPages([['today', 'today', '"p-today-1"']]),
  });
  const devShell = createDevShellConfig({
    fetch: server.fetch,
    server: { url: 'http://192.168.1.20:3000', host: '192.168.1.20:3000', pair: 'k3x9q' },
    shell,
    WebSocket: FakeWebSocket,
  });
  const { auth, host, session } = await createShellApp({
    onSignedOut: vi.fn(),
    shell: devShell,
  });
  await session.sync();
  await host.fetch('http://192.168.1.20:3000/api/endpoints/save', { method: 'POST' });

  const calls = server.fetch.mock.calls;
  expect(calls.map(([url]) => new URL(url).pathname)).toEqual([
    '/api/mobile/root',
    '/api/user',
    '/api/page/today',
    '/api/page/jobs',
    '/api/page/jobs/%7Bjob_id%7D',
    '/api/endpoints/save',
  ]);
  calls.forEach(([url, init]) => {
    expect(url.startsWith('http://192.168.1.20:3000/')).toBe(true);
    expect(header(init, 'x-lowdefy-pair')).toBe('k3x9q');
    expect(header(init, 'x-lowdefy-shell')).toBe('7.0.0');
  });
  // A block's streamed call (AgentChat's chat stream) goes through expo/fetch, sent the same way.
  await host.streamFetch('http://192.168.1.20:3000/api/agent/chat/assistant', { method: 'POST' });
  expect(server.fetch).toHaveBeenCalledTimes(calls.length);
  const [[streamUrl, streamInit]] = expoFetch.mock.calls;
  expect(streamUrl).toBe('http://192.168.1.20:3000/api/agent/chat/assistant');
  expect(streamInit.credentials).toBe('omit');
  expect(header(streamInit, 'x-lowdefy-pair')).toBe('k3x9q');
  expect(header(streamInit, 'x-lowdefy-shell')).toBe('7.0.0');
  const socket = new host.WebSocket('ws://192.168.1.20:3000/api/websocket');
  expect(socket.options.headers).toEqual({ 'x-lowdefy-pair': 'k3x9q' });
  auth.dispose();
});
