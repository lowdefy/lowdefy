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

import { vi, afterAll, beforeEach, expect, test } from 'vitest';
import * as RealLight from '@sentry/node-core/light';

const envelopes = [];
function createStubTransport() {
  return {
    send: async (envelope) => {
      envelopes.push(envelope);
      return {};
    },
    flush: async () => true,
  };
}

const imported = { node: false, light: false };
const nodeInit = vi.fn();
const nodeHttpIntegration = vi.fn(() => ({ name: 'Http' }));

// @sentry/node is a stub that records its import, so a test can tell which SDK started. The light
// SDK is real, with its network transport swapped for memory.
vi.doMock('@sentry/node', () => {
  imported.node = true;
  return { init: nodeInit, httpIntegration: nodeHttpIntegration };
});
vi.doMock('@sentry/node-core/light', () => {
  imported.light = true;
  return {
    ...RealLight,
    init: (options) => RealLight.init({ ...options, transport: createStubTransport }),
  };
});
const loggerConfig = { sentry: {} };
vi.doMock('../../build/logger.js', () => ({ default: loggerConfig }));

const { default: initSentryServer } = await import('./initSentry.js');
const { default: sentrySdk } = await import('./sentrySdk.js');
const { default: captureSentryError } = await import('./captureSentryError.js');
const { default: setSentryUser } = await import('./setSentryUser.js');

function sentEvents() {
  return envelopes.flatMap(([, items]) =>
    items.filter(([header]) => header.type === 'event').map(([, payload]) => payload)
  );
}

beforeEach(() => {
  envelopes.length = 0;
});

afterAll(async () => {
  await RealLight.close();
});

test('initSentry imports no Sentry SDK and returns null when SENTRY_DSN is not set', async () => {
  delete process.env.SENTRY_DSN;
  expect(await initSentryServer({ serverless: true })).toBe(null);
  expect(imported).toEqual({ node: false, light: false });
  expect(sentrySdk.current).toBe(null);
});

test('initSentry on a serverless function reports errors with the light SDK, without tracing or client reports', async () => {
  process.env.SENTRY_DSN = 'https://public@o0.ingest.sentry.io/1';
  const sentry = await initSentryServer({ serverless: true });
  expect(imported).toEqual({ node: false, light: true });
  expect(sentrySdk.current).toBe(sentry);
  const client = RealLight.getClient();
  expect(client).toBeInstanceOf(RealLight.LightNodeClient);
  const options = client.getOptions();
  expect(options.tracesSampleRate).toBeUndefined();
  expect(options.sendClientReports).toBe(false);
  expect(options.integrations.filter(({ name }) => name === 'Http')).toHaveLength(1);
});

// A request handler that, like the Vercel function entry, reads the body with for await, sets the
// caller from a header and, when asked, waits and then captures an error, so a second request
// sets its own user while the first is still running.
async function handleRequest(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  setSentryUser({ user: { id: req.headers['x-user'] } });
  if (req.headers['x-fail'] === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 50));
    captureSentryError({ error: new Error('Endpoint failed.'), context: { rid: 'req-1' } });
  }
  res.end('{}');
}

async function startServer() {
  const server = http.createServer((req, res) => {
    handleRequest(req, res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}

function post({ port, user, fail }) {
  return fetch(`http://127.0.0.1:${port}/api/endpoints/sign-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-user': user, 'x-fail': String(fail) },
    body: JSON.stringify({ email: 'user@example.com', password: 'planted-user-password' }),
  }).then((response) => response.text());
}

test('a serverless request that captures nothing leaves nothing for the flush to send', async () => {
  const server = await startServer();
  try {
    await post({ port: server.address().port, user: 'user-a', fail: false });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  expect(await sentrySdk.current.flush(2000)).toBe(true);
  expect(envelopes).toEqual([]);
});

test('a serverless request that captures an error sends it on flush, with its own user and no request body', async () => {
  const server = await startServer();
  const { port } = server.address();
  try {
    const failing = post({ port, user: 'user-a', fail: true });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await post({ port, user: 'user-b', fail: false });
    await failing;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  await sentrySdk.current.flush(2000);
  const events = sentEvents();
  expect(events).toHaveLength(1);
  expect(events[0].exception.values[0].value).toEqual('Endpoint failed.');
  expect(events[0].user).toEqual({ id: 'user-a' });
  expect(events[0].request.url).toMatch(/\/api\/endpoints\/sign-in$/);
  expect(events[0].request.data).toBeUndefined();
  expect(JSON.stringify(events[0])).not.toContain('planted-user-password');
});

test('initSentry on a serverless function with serverTracing runs @sentry/node with tracing and no client reports', async () => {
  loggerConfig.sentry = { serverTracing: true, tracesSampleRate: 0.2 };
  const sentry = await initSentryServer({ serverless: true });
  expect(imported.node).toBe(true);
  expect(sentrySdk.current).toBe(sentry);
  expect(nodeHttpIntegration.mock.calls).toEqual([[{ maxIncomingRequestBodySize: 'none' }]]);
  expect(nodeInit).toHaveBeenCalledTimes(1);
  const [options] = nodeInit.mock.calls[0];
  expect(options.tracesSampleRate).toBe(0.2);
  expect(options.sendClientReports).toBe(false);
  expect(options.integrations).toEqual([{ name: 'Http' }]);
});
