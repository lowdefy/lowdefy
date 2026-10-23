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

import dns from 'node:dns';
import http from 'node:http';
import net from 'node:net';

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

// Every test request comes from this computer. Mocking the loopback check
// makes the proxy treat it as a request from a phone on the network.
const mockIsLoopbackAddress = vi.fn();
vi.doMock('../utils/isLoopbackAddress.mjs', () => ({
  default: mockIsLoopbackAddress,
}));

const { default: startProxy } = await import('./startProxy.mjs');
const { default: createBuildActivity } = await import('../utils/createBuildActivity.mjs');
const { default: createRequestActivity } = await import('../utils/createRequestActivity.mjs');

const TOKEN = 'a'.repeat(43);

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve) => {
    server.closeAllConnections?.();
    server.close(() => resolve());
  });
}

function getFreePort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// The loopback address 'localhost' does not bind, so the LAN listener can
// share the port in a test.
async function getOtherLoopbackAddress() {
  const { address } = await dns.promises.lookup('localhost');
  return address === '::1' ? '127.0.0.1' : '::1';
}

let child;
let context;
let seen;

beforeEach(() => {
  mockIsLoopbackAddress.mockReturnValue(true);
});

afterEach(async () => {
  if (context?.proxyServer) await close(context.proxyServer);
  if (context?.lanProxyServer) await close(context.lanProxyServer);
  if (child) await close(child);
  child = undefined;
  context = undefined;
});

async function startChildAndProxy({ lan } = {}) {
  seen = [];
  child = http.createServer((req, res) => {
    seen.push(req.headers);
    res.end('ok');
  });
  child.on('upgrade', (req, socket) => {
    seen.push(req.headers);
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\nupgrade: websocket\r\nconnection: upgrade\r\n\r\n'
    );
    socket.destroy();
  });
  const internalPort = await listen(child);
  context = {
    basePath: '',
    buildActivity: createBuildActivity({ onChange: () => {} }),
    internalPort,
    lan,
    logger: { debug: vi.fn() },
    options: { port: await getFreePort() },
    requestActivity: createRequestActivity({ onChange: () => {}, throttleMs: 0 }),
  };
  await startProxy(context);
  return context.options.port;
}

test('startProxy lets a request from this computer through without a pairing token', async () => {
  const port = await startChildAndProxy({ lan: { address: '127.0.0.1', token: TOKEN } });
  const response = await fetch(`http://localhost:${port}/api/ping`);
  expect(response.status).toBe(200);
  expect(seen[0]['x-lowdefy-dev-remote']).toBeUndefined();
});

test('startProxy strips a remote marker a local caller sends itself', async () => {
  const port = await startChildAndProxy();
  await fetch(`http://localhost:${port}/api/ping`, { headers: { 'x-lowdefy-dev-remote': '1' } });
  expect(seen[0]['x-lowdefy-dev-remote']).toBeUndefined();
});

test('startProxy refuses a request from another machine without the pairing token', async () => {
  const port = await startChildAndProxy({ lan: { address: '127.0.0.1', token: TOKEN } });
  mockIsLoopbackAddress.mockReturnValue(false);
  const response = await fetch(`http://localhost:${port}/api/mobile/root`);
  expect(response.status).toBe(401);
  expect((await response.json()).message).toContain('pairing token');
  expect(seen).toEqual([]);
});

test('startProxy refuses a request from another machine with the wrong pairing token', async () => {
  const port = await startChildAndProxy({ lan: { address: '127.0.0.1', token: TOKEN } });
  mockIsLoopbackAddress.mockReturnValue(false);
  const response = await fetch(`http://localhost:${port}/api/mobile/root`, {
    headers: { 'x-lowdefy-pair': 'b'.repeat(43) },
  });
  expect(response.status).toBe(401);
  expect(seen).toEqual([]);
});

test('startProxy refuses every request from another machine when --lan is off', async () => {
  const port = await startChildAndProxy();
  mockIsLoopbackAddress.mockReturnValue(false);
  const response = await fetch(`http://localhost:${port}/api/mobile/root`, {
    headers: { 'x-lowdefy-pair': TOKEN },
  });
  expect(response.status).toBe(401);
});

test('startProxy forwards a paired request marked remote, without the token', async () => {
  const port = await startChildAndProxy({ lan: { address: '127.0.0.1', token: TOKEN } });
  mockIsLoopbackAddress.mockReturnValue(false);
  const response = await fetch(`http://localhost:${port}/api/mobile/root`, {
    headers: { 'x-lowdefy-pair': TOKEN },
  });
  expect(response.status).toBe(200);
  expect(seen[0]['x-lowdefy-dev-remote']).toBe('1');
  expect(seen[0]['x-lowdefy-pair']).toBeUndefined();
});

function upgrade({ port, headers }) {
  return new Promise((resolve) => {
    const clientRequest = http.get(`http://localhost:${port}/hmr`, {
      headers: { connection: 'upgrade', upgrade: 'websocket', ...headers },
    });
    clientRequest.on('upgrade', (res, socket) => {
      socket.destroy();
      resolve(res.statusCode);
    });
    clientRequest.on('response', (res) => {
      res.resume();
      resolve(res.statusCode);
    });
  });
}

test('startProxy refuses a websocket upgrade from another machine without the token', async () => {
  const port = await startChildAndProxy({ lan: { address: '127.0.0.1', token: TOKEN } });
  mockIsLoopbackAddress.mockReturnValue(false);
  expect(await upgrade({ port, headers: {} })).toBe(401);
  expect(seen).toEqual([]);
});

test('startProxy forwards a paired websocket upgrade marked remote, without the token', async () => {
  const port = await startChildAndProxy({ lan: { address: '127.0.0.1', token: TOKEN } });
  mockIsLoopbackAddress.mockReturnValue(false);
  expect(await upgrade({ port, headers: { 'x-lowdefy-pair': TOKEN } })).toBe(101);
  expect(seen[0]['x-lowdefy-dev-remote']).toBe('1');
  expect(seen[0]['x-lowdefy-pair']).toBeUndefined();
});

test('startProxy also listens on the --lan address, behind the same pairing gate', async () => {
  const address = await getOtherLoopbackAddress();
  const port = await startChildAndProxy({ lan: { address, token: TOKEN } });
  expect(context.lanProxyServer.address()).toMatchObject({ address, port });
  mockIsLoopbackAddress.mockReturnValue(false);
  const host = address.includes(':') ? `[${address}]` : address;
  const refused = await fetch(`http://${host}:${port}/api/ping`);
  expect(refused.status).toBe(401);
  const paired = await fetch(`http://${host}:${port}/api/ping`, {
    headers: { 'x-lowdefy-pair': TOKEN },
  });
  expect(paired.status).toBe(200);
});
