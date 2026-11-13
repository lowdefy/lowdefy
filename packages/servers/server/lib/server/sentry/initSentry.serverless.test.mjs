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
import { Hono } from 'hono';
import * as RealSentry from '@sentry/node';
import { markCredential, runInCredentialScope } from '@lowdefy/node-utils';

const sessionCookie = 'planted-session-cookie-0001';
const plainCookie = 'planted-plain-cookie-0001';
const password = 'planted-user-password';
const clientIp = '203.0.113.79';

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

const imported = { node: false };

// The real SDK, with its network transport swapped for memory, that records its import, so a
// test can tell whether Sentry was loaded at all.
vi.doMock('@sentry/node', () => {
  imported.node = true;
  return {
    ...RealSentry,
    init: (options) => RealSentry.init({ ...options, transport: createStubTransport }),
  };
});
const loggerConfig = { sentry: {} };
vi.doMock('../../build/logger.js', () => ({ default: loggerConfig }));

const { default: initSentryServer } = await import('./initSentry.js');
const { default: sentrySdk } = await import('./sentrySdk.js');
const { default: sentryDataCollection } = await import('./sentryDataCollection.js');
const { default: spanCredentialScrubs } = await import('./spanCredentialScrubs.js');
const { default: captureSentryError } = await import('./captureSentryError.js');
const { default: setSentryUser } = await import('./setSentryUser.js');
const { default: sentryMiddleware } = await import('../../../src/middleware/sentry.js');
const { default: createErrorHandler } = await import('../../../src/middleware/errorHandler.js');

function sentEvents() {
  return envelopes.flatMap(([, items]) =>
    items.filter(([header]) => header.type === 'event').map(([, payload]) => payload)
  );
}

function sentSpans() {
  return envelopes.flatMap(([, items]) =>
    items.filter(([header]) => header.type === 'span').flatMap(([, payload]) => payload.items)
  );
}

function attribute(span, key) {
  return span.attributes?.[key]?.value;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
  envelopes.length = 0;
});

afterAll(async () => {
  await RealSentry.close();
});

// The app the Vercel function serves: the middlewares the production app runs first, a request
// context whose handleError captures with Lowdefy's tags, as createHandleError does, and the
// app's error handler. A request sets its caller from a header and, when asked, waits (so a
// second request sets its own caller meanwhile) and then fails.
function createTestApp() {
  const app = new Hono();
  app.use('*', (c, next) => runInCredentialScope(next));
  app.use('*', sentryMiddleware());
  app.use('*', (c, next) => {
    c.set('lowdefyContext', {
      rid: 'req-1',
      handleError: async (error) =>
        captureSentryError({ error, context: { rid: 'req-1', pageId: 'page-1' } }),
    });
    return next();
  });
  app.post('/api/endpoints/:endpointId', async (c) => {
    await c.req.json();
    setSentryUser({ user: { id: c.req.header('x-user') } });
    const markedKey = c.req.header('x-marked-key');
    markCredential(markedKey);
    if (c.req.header('x-fail') === 'true') {
      await wait(50);
      throw new Error(`Endpoint failed for ${markedKey}`);
    }
    return c.json({ ok: true });
  });
  app.onError(createErrorHandler({ logger: { error: vi.fn(), warn: vi.fn() } }));
  return app;
}

// Like the Vercel function entry (lowdefy vercel-output): a plain Node HTTP server that reads
// the body itself and calls app.fetch.
async function startServer() {
  const app = createTestApp();
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const response = await app.fetch(
      new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: Buffer.concat(chunks),
      })
    );
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.appendHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}

function post({ port, user, markedKey, fail }) {
  return fetch(`http://127.0.0.1:${port}/api/endpoints/sign-in?ref=${markedKey}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `lowdefy.session_token=${sessionCookie}; theme=${plainCookie}`,
      'x-forwarded-for': clientIp,
      'x-user': user,
      'x-marked-key': markedKey,
      'x-fail': String(fail),
    },
    body: JSON.stringify({ email: 'user@example.com', password }),
  }).then((response) => response.text());
}

function expectNoPrivateData(sent, markedKeys) {
  const text = JSON.stringify(sent);
  markedKeys.forEach((markedKey) => expect(text).not.toContain(markedKey));
  expect(text).not.toContain(sessionCookie);
  expect(text).not.toContain(plainCookie);
  expect(text).not.toContain(password);
  expect(text).not.toContain(clientIp);
}

test('initSentry imports no Sentry SDK and returns null when SENTRY_DSN is not set', async () => {
  delete process.env.SENTRY_DSN;
  expect(await initSentryServer({ serverless: true })).toBe(null);
  expect(imported).toEqual({ node: false });
  expect(sentrySdk.current).toBe(null);
});

test('initSentry on a serverless function reports errors only, without module hooks, client reports or the Hono integration', async () => {
  process.env.SENTRY_DSN = 'https://public@o0.ingest.sentry.io/1';
  const sentry = await initSentryServer({ serverless: true });
  expect(imported).toEqual({ node: true });
  expect(sentrySdk.current).toBe(sentry);
  const client = RealSentry.getClient();
  const options = client.getOptions();
  expect(options.tracesSampleRate).toBeUndefined();
  expect(options.enableRuntimeChannelInjection).toBe(false);
  expect(options.sendClientReports).toBe(false);
  expect(options.dataCollection).toBe(sentryDataCollection);
  expect(options.attachStacktrace).toBe(false);
  expect(options.integrations.filter(({ name }) => name === 'Http')).toHaveLength(1);
  expect(client.getIntegrationByName('Hono')).toBeUndefined();
});

test('a serverless request that captures nothing leaves nothing for the flush to send', async () => {
  const server = await startServer();
  try {
    await post({
      port: server.address().port,
      user: 'user-a',
      markedKey: 'runtime-made-app-key-0001',
      fail: false,
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  expect(await sentrySdk.current.flush(2000)).toBe(true);
  expect(envelopes).toEqual([]);
});

test('an error thrown in a serverless route is captured once, with its own user and Lowdefy tags, and no cookie, body, address or marked credential', async () => {
  const keyA = 'runtime-made-app-key-aaaa';
  const keyB = 'runtime-made-app-key-bbbb';
  const server = await startServer();
  const { port } = server.address();
  try {
    const failing = post({ port, user: 'user-a', markedKey: keyA, fail: true });
    await wait(10);
    await post({ port, user: 'user-b', markedKey: keyB, fail: false });
    await failing;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  await sentrySdk.current.flush(2000);
  const events = sentEvents();
  expect(events).toHaveLength(1);
  const [event] = events;
  expect(event.exception.values[0].value).toEqual('Endpoint failed for [REDACTED]');
  expect(event.exception.values[0].mechanism.handled).toBe(true);
  expect(event.tags).toMatchObject({ requestId: 'req-1', pageId: 'page-1' });
  expect(event.user).toEqual({ id: 'user-a' });
  expect(event.request.url).toMatch(/\/api\/endpoints\/sign-in\?ref=\[REDACTED\]$/);
  expect(event.request.data).toBeUndefined();
  expect(event.request.cookies).toBeUndefined();
  expectNoPrivateData(event, [keyA, keyB]);
  expect(sentSpans()).toEqual([]);
  expect(spanCredentialScrubs.size).toBe(0);
});

test('initSentry on a serverless function with serverTracing streams one scrubbed http.server span per request, still without module hooks or client reports', async () => {
  loggerConfig.sentry = { serverTracing: true, tracesSampleRate: 1 };
  const sentry = await initSentryServer({ serverless: true });
  expect(sentrySdk.current).toBe(sentry);
  const options = RealSentry.getClient().getOptions();
  expect(options.tracesSampleRate).toBe(1);
  expect(options.enableRuntimeChannelInjection).toBe(false);
  expect(options.sendClientReports).toBe(false);

  const markedKey = 'runtime-made-app-key-0002';
  const server = await startServer();
  try {
    await post({ port: server.address().port, user: 'user-a', markedKey, fail: true });
    await wait(50);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  await sentrySdk.current.flush(2000);
  const spans = sentSpans();
  const roots = spans.filter(
    (span) =>
      attribute(span, 'sentry.op') === 'http.server' &&
      attribute(span, 'url.path') === '/api/endpoints/sign-in'
  );
  expect(roots).toHaveLength(1);
  expect(roots[0].name).toEqual('POST /api/endpoints/:endpointId');
  const requestSpans = spans.filter(
    (span) => attribute(span, 'sentry.segment.id') === roots[0].span_id
  );
  expectNoPrivateData(requestSpans, [markedKey]);
  const events = sentEvents();
  expect(events).toHaveLength(1);
  expect(events[0].tags).toMatchObject({ requestId: 'req-1', pageId: 'page-1' });
  expectNoPrivateData(events, [markedKey]);
  expect(spanCredentialScrubs.size).toBe(0);
});
