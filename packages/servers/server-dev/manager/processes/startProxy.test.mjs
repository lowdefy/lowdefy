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
const { default: createBuildActivity } = await import('../utils/createBuildActivity.mjs');
const { default: createRequestActivity } = await import('../utils/createRequestActivity.mjs');

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
let activityRecords;

afterEach(async () => {
  if (context?.proxyServer) await close(context.proxyServer);
  if (child) await close(child);
  child = undefined;
  context = undefined;
});

async function startChildAndProxy(handler) {
  child = http.createServer(handler);
  const internalPort = await listen(child);
  activityRecords = [];
  context = {
    internalPort,
    options: { port: await getFreePort() },
    logger: { debug: jest.fn() },
    requestActivity: createRequestActivity({
      onChange: (fields) => activityRecords.push(fields),
      throttleMs: 0,
    }),
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

function echoRequest(label) {
  return async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        label,
        body: Buffer.concat(chunks).toString('utf8'),
        buildWait: req.headers['x-lowdefy-build-wait'] ?? null,
      })
    );
  };
}

function mcpCall(name, args) {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name, arguments: args },
  });
}

test.each([
  ['GET build-status?wait=true', () => ({ path: '/lowdefy-docs/build-status?wait=true' })],
  [
    'the lowdefy_build_status MCP tool with wait: true',
    () => ({
      path: '/lowdefy-docs/mcp',
      init: { method: 'POST', body: mcpCall('lowdefy_build_status', { wait: true }) },
    }),
  ],
])(
  'startProxy holds %s through a restart and forwards it to the new server',
  async (_, makeRequest) => {
    const port = await startChildAndProxy(echoRequest('old'));
    context.basePath = '';
    context.buildActivity = createBuildActivity({ onChange: () => {} });
    context.devServer = { exitCode: null, signalCode: null };
    context.buildActivity.setBusy(true);
    // waitedMs is timed from when the proxy starts waiting, a moment after the request is sent.
    // Holding for 200ms from that moment, not from the fetch call, keeps the waitedMs assertion
    // below from racing the request's arrival.
    const { waitForIdle } = context.buildActivity;
    const waitStarted = new Promise((resolve) => {
      context.buildActivity.waitForIdle = (options) => {
        const waiting = waitForIdle(options);
        resolve();
        return waiting;
      };
    });

    const { path: requestPath, init } = makeRequest();
    const pending = fetch(`http://localhost:${port}${requestPath}`, {
      ...init,
      headers: { 'x-lowdefy-build-wait': 'settled=true&sawBuild=false&waitedMs=0' },
    }).then((response) => response.json());
    await waitStarted;
    await new Promise((resolve) => setTimeout(resolve, 200));

    // The restart the build needed: the old server stops, a new one answers.
    context.devServerExited = Promise.resolve();
    context.devServer = { exitCode: null, signalCode: null };
    await close(child);
    child = http.createServer(echoRequest('new'));
    await new Promise((resolve) => child.listen(context.internalPort, '127.0.0.1', resolve));
    context.buildActivity.setBusy(false);

    const result = await pending;
    expect(result.label).toBe('new');
    expect(result.body).toBe(init?.body ?? '');
    const wait = new URLSearchParams(result.buildWait);
    expect(wait.get('settled')).toBe('true');
    expect(wait.get('sawBuild')).toBe('true');
    expect(Number(wait.get('waitedMs'))).toBeGreaterThanOrEqual(200);
  }
);

test('startProxy forwards other MCP calls and build-status reads at once, with their body', async () => {
  const port = await startChildAndProxy(echoRequest('child'));
  context.basePath = '';
  context.buildActivity = createBuildActivity({ onChange: () => {} });
  context.buildActivity.setBusy(true);
  const body = mcpCall('lowdefy_build_status', {});

  const [call, read] = await Promise.all([
    fetch(`http://localhost:${port}/lowdefy-docs/mcp`, {
      method: 'POST',
      body,
      headers: { 'x-lowdefy-build-wait': 'settled=true' },
    }).then((response) => response.json()),
    fetch(`http://localhost:${port}/lowdefy-docs/build-status`).then((response) => response.json()),
  ]);

  expect(call).toEqual({ label: 'child', body, buildWait: null });
  expect(read).toEqual({ label: 'child', body: '', buildWait: null });
});

const paddedWaitCall = mcpCall('lowdefy_build_status', { wait: true, pad: 'x'.repeat(70 * 1024) });
const waitCall = mcpCall('lowdefy_build_status', { wait: true });

test.each([
  ['a body larger than 64 KiB', { body: paddedWaitCall }, paddedWaitCall],
  [
    'a streamed body without a length',
    { body: new Blob([waitCall]).stream(), duplex: 'half' },
    waitCall,
  ],
])('startProxy forwards an MCP POST with %s unread, without holding it', async (_, init, sent) => {
  const port = await startChildAndProxy(echoRequest('child'));
  context.basePath = '';
  context.buildActivity = createBuildActivity({ onChange: () => {} });
  context.buildActivity.setBusy(true);

  const call = await fetch(`http://localhost:${port}/lowdefy-docs/mcp`, {
    method: 'POST',
    ...init,
  }).then((response) => response.json());

  expect(call).toEqual({ label: 'child', body: sent, buildWait: null });
});

function activeRequests() {
  return activityRecords.at(-1).activeRequests;
}

async function waitFor(check) {
  const deadline = Date.now() + 2000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error('Condition not met within 2 seconds.');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

// A child that holds every response open until release() is called.
function heldHandler({ contentType = 'text/plain' } = {}) {
  const held = [];
  function handler(req, res) {
    res.writeHead(200, { 'content-type': contentType });
    res.flushHeaders();
    if (contentType === 'text/event-stream') res.write('event: message\ndata: {}\n\n');
    held.push(res);
  }
  function release() {
    held.splice(0).forEach((res) => res.end('done'));
  }
  return { handler, held, release };
}

test('startProxy counts a request as activity for as long as it is in flight', async () => {
  const child$ = heldHandler();
  const port = await startChildAndProxy(child$.handler);
  context.basePath = '';
  expect(activeRequests()).toBe(0);

  const pending = fetch(`http://localhost:${port}/api/request/page/get`).then((response) =>
    response.text()
  );
  await waitFor(() => child$.held.length === 1);
  expect(activeRequests()).toBe(1);

  child$.release();
  expect(await pending).toBe('done');
  await waitFor(() => activeRequests() === 0);
});

test('startProxy counts an MCP POST answered as an event stream until it ends', async () => {
  const child$ = heldHandler({ contentType: 'text/event-stream' });
  const port = await startChildAndProxy(child$.handler);
  context.basePath = '';

  const pending = fetch(`http://localhost:${port}/lowdefy-docs/mcp`, {
    method: 'POST',
    headers: { accept: 'application/json, text/event-stream' },
    body: mcpCall('lowdefy_screenshot', {}),
  }).then((response) => response.text());
  await waitFor(() => child$.held.length === 1);
  expect(activeRequests()).toBe(1);

  child$.release();
  await pending;
  await waitFor(() => activeRequests() === 0);
});

test.each([
  ['a GET that opens an event stream', { accept: 'text/event-stream' }],
  ['a passive request', { 'x-lowdefy-passive': '1' }],
])('startProxy does not count %s as activity', async (_, headers) => {
  const child$ = heldHandler({ contentType: 'text/event-stream' });
  const port = await startChildAndProxy(child$.handler);
  context.basePath = '';
  const before = activityRecords.length;

  const clientRequest = http.get(`http://localhost:${port}/lowdefy-docs/mcp`, { headers });
  await new Promise((resolve) => clientRequest.on('response', resolve));
  await waitFor(() => child$.held.length === 1);
  clientRequest.destroy();
  child$.release();
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(activityRecords.length).toBe(before);
});

test('startProxy ends the activity of a request whose client goes away', async () => {
  const child$ = heldHandler();
  const port = await startChildAndProxy(child$.handler);
  context.basePath = '';

  const clientRequest = http.get(`http://localhost:${port}/slow`);
  clientRequest.on('error', () => {});
  await waitFor(() => child$.held.length === 1);
  expect(activeRequests()).toBe(1);

  clientRequest.destroy();
  await waitFor(() => activeRequests() === 0);
  child$.release();
});

test('startProxy does not count a websocket upgrade as activity', async () => {
  const port = await startChildAndProxy((req, res) => res.end('ok'));
  const childSockets = [];
  child.on('upgrade', (req, socket) => {
    childSockets.push(socket);
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\nupgrade: websocket\r\nconnection: upgrade\r\n\r\n'
    );
  });
  const before = activityRecords.length;

  const clientRequest = http.get(`http://localhost:${port}/hmr`, {
    headers: { connection: 'upgrade', upgrade: 'websocket' },
  });
  const socket = await new Promise((resolve) =>
    clientRequest.on('upgrade', (res, upgraded) => resolve(upgraded))
  );

  expect(activityRecords.length).toBe(before);
  socket.destroy();
  childSockets.forEach((childSocket) => childSocket.destroy());
});

test('startProxy keeps a request held through a child restart counted', async () => {
  const port = await startChildAndProxy((req, res) => res.end('old'));
  context.basePath = '';
  context.devServer = { exitCode: null, signalCode: null };
  expect(await (await fetch(`http://localhost:${port}/a.js`)).text()).toBe('old');
  await waitFor(() => activeRequests() === 0);

  await close(child);
  context.devServer.exitCode = 1;
  const pending = fetch(`http://localhost:${port}/b.js`).then((response) => response.text());
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(activeRequests()).toBe(1);

  context.devServer = { exitCode: null, signalCode: null };
  child = http.createServer((req, res) => res.end('new'));
  await new Promise((resolve) => child.listen(context.internalPort, '127.0.0.1', resolve));

  expect(await pending).toBe('new');
  await waitFor(() => activeRequests() === 0);
});
