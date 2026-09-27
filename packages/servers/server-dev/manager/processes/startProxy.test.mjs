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

test('startProxy probes a running child once instead of opening a connection per request', async () => {
  let childConnections = 0;
  const port = await startChildAndProxy((req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
  });
  child.on('connection', () => {
    childConnections += 1;
  });
  context.devServer = { exitCode: null, signalCode: null };

  for (let i = 0; i < 20; i += 1) {
    const response = await fetch(`http://localhost:${port}/module-${i}.js`);
    expect(await response.text()).toBe('ok');
  }

  // One probe, then the keep-alive agent's socket - not a probe per request.
  expect(childConnections).toBeLessThanOrEqual(2);
});

test('startProxy probes a new child after a restart before forwarding to it', async () => {
  let childConnections = 0;
  const port = await startChildAndProxy((req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
  });
  child.on('connection', () => {
    childConnections += 1;
  });
  context.devServer = { exitCode: null, signalCode: null };
  await fetch(`http://localhost:${port}/a.js`).then((response) => response.text());
  const afterFirstChild = childConnections;

  context.devServer = { exitCode: null, signalCode: null };
  await fetch(`http://localhost:${port}/b.js`).then((response) => response.text());

  expect(childConnections).toBe(afterFirstChild + 1);
});

test('startProxy sends requests back through the hold once a confirmed child goes away', async () => {
  function handler(req, res) {
    res.end('ok');
  }
  const port = await startChildAndProxy(handler);
  context.devServer = { exitCode: null, signalCode: null };
  expect(await (await fetch(`http://localhost:${port}/a.js`)).text()).toBe('ok');

  async function stopChildAndRestartSoon() {
    await close(child);
    setTimeout(() => {
      child = http.createServer(handler);
      child.listen(context.internalPort, '127.0.0.1');
    }, 300);
  }

  // Gone before the manager has seen it exit: a GET never reached the child,
  // so it is replayed through the hold and answered by the next child.
  await stopChildAndRestartSoon();
  expect(await (await fetch(`http://localhost:${port}/b.js`)).text()).toBe('ok');

  // A POST's body was consumed by the failed forward, so it fails once, and
  // the next request waits for the child instead of failing too.
  await stopChildAndRestartSoon();
  expect(
    (await fetch(`http://localhost:${port}/save`, { method: 'POST', body: '{}' })).status
  ).toBe(502);
  expect(await (await fetch(`http://localhost:${port}/c.js`)).text()).toBe('ok');

  // An exit the manager has seen sends the very next request through the hold.
  await stopChildAndRestartSoon();
  context.devServer.exitCode = 1;
  expect(await (await fetch(`http://localhost:${port}/d.js`)).text()).toBe('ok');
});

test('startProxy waits for a stopped child to exit before probing its replacement', async () => {
  const port = await startChildAndProxy((req, res) => res.end('old'));
  context.devServer = { exitCode: null, signalCode: null };
  expect(await (await fetch(`http://localhost:${port}/a.js`)).text()).toBe('old');

  // A restart: the old child is signalled but answers until it exits.
  let markExited;
  context.devServerExited = new Promise((resolve) => {
    markExited = resolve;
  });
  context.devServer = { exitCode: null, signalCode: null };
  const pending = fetch(`http://localhost:${port}/b.js`).then((response) => response.text());
  await new Promise((resolve) => setTimeout(resolve, 100));
  await close(child);
  child = http.createServer((req, res) => res.end('new'));
  await new Promise((resolve) => child.listen(context.internalPort, '127.0.0.1', resolve));
  markExited();

  expect(await pending).toBe('new');
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
