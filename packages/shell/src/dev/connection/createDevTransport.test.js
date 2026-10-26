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

import createDevShellConfig from './createDevShellConfig.js';
import createDevTransport from './createDevTransport.js';
import createMemoryStore from '../../host/createMemoryStore.js';
import createServerList from './createServerList.js';

const shell = { id: 'lowdefy-dev', environment: 'dev', scheme: 'lowdefy-dev', version: '7.0.0' };

class FakeWebSocket {
  constructor(url, protocols, options) {
    this.args = { url, protocols, options };
  }
}

test('a paired server gets the pairing token on every call and websocket upgrade', async () => {
  const fetch = jest.fn(async () => ({ status: 200 }));
  const transport = createDevTransport({ fetch, pair: 'k3x9q', WebSocket: FakeWebSocket });
  await transport.fetch('http://192.168.1.20:3000/api/mobile/root', { headers: { a: '1' } });
  expect(fetch.mock.calls[0][1].headers).toEqual({ a: '1', 'x-lowdefy-pair': 'k3x9q' });
  const socket = new transport.WebSocket('ws://192.168.1.20:3000/api/websocket', undefined, {
    headers: { Authorization: 'Bearer t' },
  });
  expect(socket).toBeInstanceOf(FakeWebSocket);
  expect(socket.args.options.headers).toEqual({
    Authorization: 'Bearer t',
    'x-lowdefy-pair': 'k3x9q',
  });
  const streamFetch = jest.fn(async () => ({ status: 200 }));
  await transport.wrapFetch(streamFetch)('http://192.168.1.20:3000/api/reload');
  expect(streamFetch.mock.calls[0][1].headers).toEqual({ 'x-lowdefy-pair': 'k3x9q' });
});

test('a server on this device gets the platform fetch and WebSocket, with no token', () => {
  const fetch = jest.fn();
  const transport = createDevTransport({ fetch, pair: null, WebSocket: FakeWebSocket });
  expect(transport.fetch).toBe(fetch);
  expect(transport.WebSocket).toBe(FakeWebSocket);
});

test('each dev server is its own app, at its url', () => {
  const config = createDevShellConfig({
    fetch: jest.fn(),
    server: { url: 'http://192.168.1.20:3000', host: '192.168.1.20:3000', pair: 'k3x9q' },
    shell,
    WebSocket: FakeWebSocket,
  });
  expect(config.app).toEqual({
    id: 'dev-192.168.1.20_3000',
    name: '192.168.1.20:3000',
    urls: { dev: 'http://192.168.1.20:3000' },
  });
  expect(config).not.toHaveProperty('apps');
  expect(config.version).toBe('7.0.0');
});

test('the last 5 servers are remembered, the last one first', () => {
  const servers = createServerList({ kv: createMemoryStore() });
  [1, 2, 3, 4, 5, 6].forEach((n) => {
    servers.remember({ url: `http://10.0.0.${n}:3000`, host: `10.0.0.${n}:3000`, pair: null });
  });
  servers.remember({ url: 'http://10.0.0.4:3000', host: '10.0.0.4:3000', pair: 'p' });
  expect(servers.list().map((server) => server.host)).toEqual([
    '10.0.0.4:3000',
    '10.0.0.6:3000',
    '10.0.0.5:3000',
    '10.0.0.3:3000',
    '10.0.0.2:3000',
  ]);
  expect(servers.last()).toEqual({ url: 'http://10.0.0.4:3000', host: '10.0.0.4:3000', pair: 'p' });
});
