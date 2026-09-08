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

import http from 'node:http';
import net from 'node:net';

import { jest } from '@jest/globals';

const { default: startProxy } = await import('./startProxy.mjs');

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

let child;
let context;

afterEach(async () => {
  if (context?.proxyServer) await close(context.proxyServer);
  if (child) await close(child);
  child = undefined;
  context = undefined;
});

async function startChildAndProxy(handler) {
  child = http.createServer(handler);
  const internalPort = await listen(child);
  context = {
    internalPort,
    options: { port: await getFreePort() },
    logger: { debug: jest.fn() },
  };
  await startProxy(context);
  return context.options.port;
}

test('startProxy forwards a request to the child and relays its response', async () => {
  const port = await startChildAndProxy((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ path: req.url }));
  });
  const response = await fetch(`http://localhost:${port}/api/ping?x=1`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ path: '/api/ping?x=1' });
});

test('startProxy aborts the child request when the client drops a streaming response', async () => {
  let upstreamClosed;
  const upstreamClosedPromise = new Promise((resolve) => {
    upstreamClosed = resolve;
  });
  const port = await startChildAndProxy((req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.flushHeaders();
    res.write('event: tab\ndata: {}\n\n');
    // Never ends — like the reload SSE stream, it lives until the client goes.
    req.on('close', () => upstreamClosed('closed'));
  });

  const clientRequest = http.get(`http://localhost:${port}/api/reload`);
  const clientResponse = await new Promise((resolve) => clientRequest.on('response', resolve));
  await new Promise((resolve) => clientResponse.once('data', resolve));
  clientRequest.destroy();

  const outcome = await Promise.race([
    upstreamClosedPromise,
    new Promise((resolve) => setTimeout(() => resolve('still open'), 2000)),
  ]);
  expect(outcome).toBe('closed');
});
