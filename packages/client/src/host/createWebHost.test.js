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

import createWebHost from './createWebHost.js';

function createWindow({ protocol = 'https:' } = {}) {
  return {
    document: { title: 'doc' },
    fetch: jest.fn(async () => 'response'),
    location: { host: 'app.example.com', protocol, reload: jest.fn() },
    localStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
    WebSocket: function WebSocket() {},
  };
}

test('createWebHost passes the browser objects as the engine globals', () => {
  const win = createWindow();
  const host = createWebHost({ router: {}, window: win });
  expect(host.globals).toEqual({ document: win.document, fetch: win.fetch, window: win });
});

test('createWebHost fetches with the window fetch at call time', async () => {
  const win = createWindow();
  const host = createWebHost({ router: {}, window: win });
  win.fetch = jest.fn(async () => 'later');
  await expect(host.fetch('/api/x', { method: 'POST' })).resolves.toBe('later');
  expect(win.fetch).toHaveBeenCalledWith('/api/x', { method: 'POST' });
});

test('createWebHost reloads the tab when the build or the caller changes', () => {
  const win = createWindow();
  const host = createWebHost({ router: {}, window: win });
  host.onBuildChanged({ serverBuildId: 'build-2' });
  host.onCallerChanged(null);
  expect(win.location.reload).toHaveBeenCalledTimes(2);
});

test('createWebHost gives the router and the window WebSocket', () => {
  const win = createWindow();
  const router = { push: jest.fn() };
  const host = createWebHost({ router, window: win });
  expect(host.router).toBe(router);
  expect(host.WebSocket).toBe(win.WebSocket);
});

test('createWebHost builds a websocket URL on the page origin for a path', () => {
  expect(
    createWebHost({ router: {}, window: createWindow() }).websocketUrl('/crm/api/websocket')
  ).toBe('wss://app.example.com/crm/api/websocket');
  expect(
    createWebHost({ router: {}, window: createWindow({ protocol: 'http:' }) }).websocketUrl(
      '/api/websocket'
    )
  ).toBe('ws://app.example.com/api/websocket');
});

test('createWebHost keeps the origin of an absolute apiBase in the websocket URL', () => {
  const host = createWebHost({ router: {}, window: createWindow() });
  expect(host.websocketUrl('https://api.example.com/api/websocket')).toBe(
    'wss://api.example.com/api/websocket'
  );
  expect(host.websocketUrl('http://localhost:3001/api/websocket')).toBe(
    'ws://localhost:3001/api/websocket'
  );
});

test('createWebHost stores in localStorage and sessionStorage', () => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  const host = createWebHost({ router: {}, window: createWindow() });
  host.storage.set('a', '1');
  host.sessionStorage.set('b', '2');
  expect(window.localStorage.getItem('a')).toBe('1');
  expect(window.sessionStorage.getItem('b')).toBe('2');
});
