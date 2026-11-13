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
import { serve } from '@hono/node-server';
import * as RealSentry from '@sentry/node';
import { markCredential, runInCredentialScope } from '@lowdefy/node-utils';
import WebSocket, { WebSocketServer } from 'ws';

const secret = 'planted/secret+value=1';
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

const httpIntegrations = [];

// The real SDK with its network transport swapped for memory, so each test reads the exact
// events and spans Sentry would send, after the hooks initSentry installs.
vi.doMock('@sentry/node', () => ({
  ...RealSentry,
  init: (options) => RealSentry.init({ ...options, transport: createStubTransport }),
  httpIntegration: (options) => {
    const integration = RealSentry.httpIntegration(options);
    httpIntegrations.push(integration);
    return integration;
  },
}));
vi.doMock('../../build/logger.js', () => ({
  default: { sentry: { tracesSampleRate: 1 } },
}));
vi.doMock('../auth/getStrategies.js', () => ({
  default: () => [],
}));

process.env.SENTRY_DSN = 'https://public@o0.ingest.sentry.io/1';
process.env.LOWDEFY_SECRET_API_KEY = secret;

const { default: initSentryServer } = await import('./initSentry.js');
const { default: sentrySdk } = await import('./sentrySdk.js');
const { default: sentryDataCollection } = await import('./sentryDataCollection.js');
const { default: spanCredentialScrubs } = await import('./spanCredentialScrubs.js');
const { default: captureSentryError } = await import('./captureSentryError.js');
const { default: sentryMiddleware } = await import('../../../src/middleware/sentry.js');
const { default: upgradeIsolationScope } =
  await import('../../../src/middleware/upgradeIsolationScope.js');
const { default: websocketHandler } = await import('../../../src/routes/websocket.js');
const { default: createErrorHandler } = await import('../../../src/middleware/errorHandler.js');

const sentry = await initSentryServer();
const client = RealSentry.getClient();
const options = client.getOptions();

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

// The upstream test server runs in this process, and the test's own requests to the app are
// outgoing requests, so both are traced too, each as a segment of its own. Only the app's
// request spans, and the spans in their segments, count.
function serverSpans(spans) {
  return spans.filter(
    (span) =>
      attribute(span, 'sentry.op') === 'http.server' &&
      attribute(span, 'url.path').startsWith('/api/')
  );
}

function segmentSpans(spans, root) {
  return spans.filter((span) => attribute(span, 'sentry.segment.id') === root.span_id);
}

function listen(server) {
  return new Promise((resolve) => {
    if (server.listening) {
      resolve(server.address().port);
      return;
    }
    server.once('listening', () => resolve(server.address().port));
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startUpstream() {
  const upstream = http.createServer((req, res) => res.end('{}'));
  upstream.listen(0, '127.0.0.1');
  return { upstream, upstreamPort: await listen(upstream) };
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

// The middlewares the production app runs first, in its order, then a request context whose
// handleError captures with Lowdefy's tags, as createHandleError does, and the app's error handler.
function createTestApp({ upstreamPort, markedKey }) {
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
    const body = await c.req.json();
    markCredential(markedKey);
    // Sentry filters query parameters with sensitive names such as `key` itself, so the
    // credential goes in one it does not, to test that Lowdefy's scrub by value reaches it.
    await (await fetch(`http://127.0.0.1:${upstreamPort}/v1/apps?app=${markedKey}`)).text();
    // Work the request leaves running ends after the response, outside the credential scope.
    const late = sentry.startInactiveSpan({
      name: 'late work',
      attributes: { detail: `used ${markedKey}` },
    });
    setTimeout(() => late.end(), 30);
    if (body.fail) {
      throw new Error(`Endpoint failed for ${markedKey}`);
    }
    return c.json({ ok: true });
  });
  app.onError(createErrorHandler({ logger: { error: vi.fn(), warn: vi.fn() } }));
  return app;
}

function postEndpoint({ port, markedKey, fail = false, headers = {} }) {
  return fetch(`http://127.0.0.1:${port}/api/endpoints/create-app?ref=${markedKey}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `lowdefy.session_token=${sessionCookie}; theme=${plainCookie}`,
      'x-forwarded-for': clientIp,
      ...headers,
    },
    body: JSON.stringify({ email: 'user@example.com', password, fail }),
  }).then((response) => response.text());
}

function expectNoPrivateData(sent, markedKey) {
  const text = JSON.stringify(sent);
  expect(text).not.toContain(markedKey);
  expect(text).not.toContain(secret);
  expect(text).not.toContain(sessionCookie);
  expect(text).not.toContain(plainCookie);
  expect(text).not.toContain(password);
  expect(text).not.toContain(clientIp);
}

beforeEach(() => {
  envelopes.length = 0;
});

afterAll(async () => {
  await RealSentry.close();
});

test('initSentry initializes Sentry when SENTRY_DSN is set and makes its SDK the server one', () => {
  expect(client).toBeDefined();
  expect(sentry.captureException).toBe(RealSentry.captureException);
  expect(sentrySdk.current).toBe(sentry);
});

test('initSentry streams spans and keeps client reports and module hooks on a long-running server', () => {
  expect(options.tracesSampleRate).toBe(1);
  expect(options.traceLifecycle).toBe('stream');
  expect(options.sendClientReports).toBe(true);
  expect(options.enableRuntimeChannelInjection).toBe(true);
  expect(options.beforeSendTransaction).toBeUndefined();
});

test('initSentry pins what Sentry collects and keeps stack traces off captured messages', () => {
  expect(options.dataCollection).toBe(sentryDataCollection);
  expect(client.getDataCollectionOptions()).toMatchObject({
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
      response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    },
    httpBodies: [],
    urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    genAI: { inputs: false, outputs: false },
    mcp: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    stackFrameVariables: false,
    frameContextLines: 7,
  });
  expect(options.attachStacktrace).toBe(false);
});

test('initSentry installs exactly one Http integration, the one that attaches no request bodies, and no Hono integration', () => {
  expect(httpIntegrations).toHaveLength(1);
  const installedHttp = options.integrations.filter(({ name }) => name === 'Http');
  expect(installedHttp).toHaveLength(1);
  expect(installedHttp[0]).toBe(httpIntegrations[0]);
  expect(client.getIntegrationByName('Http')).toBe(httpIntegrations[0]);
  expect(client.getIntegrationByName('Hono')).toBeUndefined();
});

test('beforeSend replaces a planted secret in an exception value, a cause-chain exception value and extra', () => {
  const event = {
    event_id: 'a'.repeat(32),
    level: 'error',
    exception: {
      values: [
        {
          type: 'AxiosError',
          value: `connect failed for key ${secret}`,
          mechanism: { type: 'chained', source: 'cause', exception_id: 1, parent_id: 0 },
        },
        {
          type: 'RequestError',
          value: `Request failed: ${encodeURIComponent(secret)}`,
          stacktrace: { frames: [{ filename: 'app.js', function: 'handler', lineno: 12 }] },
          mechanism: { type: 'generic', handled: true, exception_id: 0 },
        },
      ],
    },
    extra: {
      configKey: 'key-1',
      error: { name: 'RequestError', message: `failed with ${secret}`, received: [secret] },
    },
    tags: { requestId: 'req-1' },
  };
  const scrubbed = options.beforeSend(event, {});
  expect(JSON.stringify(scrubbed)).not.toContain(secret);
  expect(JSON.stringify(scrubbed)).not.toContain(encodeURIComponent(secret));
  expect(scrubbed.exception.values[0].value).toEqual('connect failed for key [REDACTED]');
  expect(scrubbed.exception.values[1].value).toEqual('Request failed: [REDACTED]');
  expect(scrubbed.exception.values[1].stacktrace).toEqual(event.exception.values[1].stacktrace);
  expect(scrubbed.extra).toEqual({
    configKey: 'key-1',
    error: { name: 'RequestError', message: 'failed with [REDACTED]', received: ['[REDACTED]'] },
  });
  expect(scrubbed.tags).toEqual({ requestId: 'req-1' });
});

test('beforeSend scrubs an exception captured through the SDK, cause chain included', async () => {
  const cause = new Error(`upstream rejected ${secret}`);
  RealSentry.captureException(new Error('Request failed.', { cause }), {
    extra: { detail: `sent ${secret}` },
  });
  await RealSentry.flush();
  const events = sentEvents();
  expect(events).toHaveLength(1);
  expect(JSON.stringify(events[0])).not.toContain(secret);
  const values = events[0].exception.values.map(({ value }) => value);
  expect(values).toEqual(['upstream rejected [REDACTED]', 'Request failed.']);
  expect(events[0].extra.detail).toEqual('sent [REDACTED]');
});

test('beforeBreadcrumb replaces a planted secret in a breadcrumb URL', () => {
  const breadcrumb = {
    type: 'http',
    category: 'http',
    level: 'info',
    data: {
      url: `https://api.example.com/v1/items?api_key=${secret}`,
      'http.method': 'GET',
      status_code: 200,
    },
    timestamp: 1700000000,
  };
  expect(options.beforeBreadcrumb(breadcrumb)).toEqual({
    ...breadcrumb,
    data: {
      url: 'https://api.example.com/v1/items?api_key=[REDACTED]',
      'http.method': 'GET',
      status_code: 200,
    },
  });
});

function createStreamedFetchSpan() {
  return {
    trace_id: 'c'.repeat(32),
    span_id: 'b'.repeat(16),
    parent_span_id: 'd'.repeat(16),
    name: 'GET',
    start_timestamp: 1700000000,
    end_timestamp: 1700000001,
    status: 'ok',
    is_segment: false,
    attributes: {
      'sentry.op': 'http.client',
      'http.request.method': 'GET',
      'url.full': `https://api.example.com/v1/items?api_key=${secret}`,
      'http.query': `?api_key=${secret}`,
      'http.response.status_code': 200,
    },
    links: [],
  };
}

test('beforeSendSpan replaces a planted secret in a streamed fetch span url.full and http.query', () => {
  const scrubbed = options.beforeSendSpan(createStreamedFetchSpan());
  expect(JSON.stringify(scrubbed)).not.toContain(secret);
  expect(scrubbed.attributes['url.full']).toEqual(
    'https://api.example.com/v1/items?api_key=[REDACTED]'
  );
  expect(scrubbed.attributes['http.query']).toEqual('?api_key=[REDACTED]');
  expect(scrubbed.attributes['http.response.status_code']).toEqual(200);
});

test('beforeSendSpan returns the span stripped of its data, and does not throw, when the scrub fails', () => {
  const span = createStreamedFetchSpan();
  spanCredentialScrubs.set(span.span_id, () => {
    throw new Error('scrub failed');
  });
  const scrubbed = options.beforeSendSpan(span);
  expect(JSON.stringify(scrubbed)).not.toContain(secret);
  expect(scrubbed).toEqual({
    trace_id: span.trace_id,
    span_id: span.span_id,
    parent_span_id: span.parent_span_id,
    name: '[REDACTED]',
    start_timestamp: span.start_timestamp,
    end_timestamp: span.end_timestamp,
    status: 'ok',
    is_segment: false,
    attributes: { 'lowdefy.scrub_failed': true },
  });
  expect(spanCredentialScrubs.size).toBe(0);
});

test('a request streams one http.server span named by its route, and no cookie, body, address or marked credential reaches any of its spans', async () => {
  const markedKey = 'runtime-made-app-key-0001';
  const { upstream, upstreamPort } = await startUpstream();
  const server = serve({
    fetch: createTestApp({ upstreamPort, markedKey }).fetch,
    port: 0,
    hostname: '127.0.0.1',
  });
  const port = await listen(server);
  try {
    await postEndpoint({ port, markedKey });
    // The late span ends after the response, so after the request's credential scope.
    await wait(100);
  } finally {
    await closeServer(server);
    await closeServer(upstream);
  }
  await RealSentry.flush();
  const spans = sentSpans();
  const roots = serverSpans(spans);
  expect(roots).toHaveLength(1);
  const [root] = roots;
  const trace = segmentSpans(spans, root);
  expect(root.name).toEqual('POST /api/endpoints/:endpointId');
  expect(attribute(root, 'http.route')).toEqual('/api/endpoints/:endpointId');
  expect(attribute(root, 'url.full')).toMatch(/\/api\/endpoints\/create-app\?ref=\[REDACTED\]$/);
  trace.forEach((span) => {
    expect(attribute(span, 'sentry.segment.name')).toEqual('POST /api/endpoints/:endpointId');
  });
  const clientSpan = trace.find((span) => attribute(span, 'sentry.op') === 'http.client');
  expect(attribute(clientSpan, 'url.full')).toEqual(
    `http://127.0.0.1:${upstreamPort}/v1/apps?app=[REDACTED]`
  );
  const lateSpan = trace.find(({ name }) => name === 'late work');
  expect(attribute(lateSpan, 'detail')).toEqual('used [REDACTED]');
  expect(lateSpan.end_timestamp).toBeGreaterThan(root.end_timestamp);
  expectNoPrivateData(trace, markedKey);
  expect(sentEvents()).toEqual([]);
  expect(spanCredentialScrubs.size).toBe(0);
});

test('an error thrown in a route is captured once, with Lowdefy tags, and carries no cookie, body, address or marked credential', async () => {
  const markedKey = 'runtime-made-app-key-0002';
  const { upstream, upstreamPort } = await startUpstream();
  const server = serve({
    fetch: createTestApp({ upstreamPort, markedKey }).fetch,
    port: 0,
    hostname: '127.0.0.1',
  });
  const port = await listen(server);
  try {
    await postEndpoint({ port, markedKey, fail: true });
    await wait(100);
  } finally {
    await closeServer(server);
    await closeServer(upstream);
  }
  await RealSentry.flush();
  const events = sentEvents();
  expect(events).toHaveLength(1);
  const [event] = events;
  expect(event.exception.values[0].value).toEqual('Endpoint failed for [REDACTED]');
  expect(event.exception.values[0].mechanism.handled).toBe(true);
  expect(event.tags).toMatchObject({ requestId: 'req-1', pageId: 'page-1' });
  expect(event.request.url).toMatch(/\/api\/endpoints\/create-app\?ref=\[REDACTED\]$/);
  expect(event.request.data).toBeUndefined();
  expect(event.request.cookies).toBeUndefined();
  expect(event.user?.ip_address).toBeUndefined();
  expectNoPrivateData(event, markedKey);
  const spans = sentSpans();
  const roots = serverSpans(spans);
  expect(roots).toHaveLength(1);
  expect(attribute(roots[0], 'http.response.status_code')).toBe(500);
  expectNoPrivateData(segmentSpans(spans, roots[0]), markedKey);
  expect(spanCredentialScrubs.size).toBe(0);
});

// The Vercel function entry (lowdefy vercel-output) reads the body itself and calls app.fetch
// from a plain Node HTTP server, instead of @hono/node-server's request listener.
test('a request through the Vercel function listener streams one http.server span named by its route, scrubbed', async () => {
  const markedKey = 'runtime-made-app-key-0003';
  const { upstream, upstreamPort } = await startUpstream();
  const app = createTestApp({ upstreamPort, markedKey });
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
  server.listen(0, '127.0.0.1');
  const port = await listen(server);
  try {
    await postEndpoint({ port, markedKey });
    await wait(100);
  } finally {
    await closeServer(server);
    await closeServer(upstream);
  }
  await RealSentry.flush();
  const spans = sentSpans();
  const roots = serverSpans(spans);
  expect(roots).toHaveLength(1);
  expect(roots[0].name).toEqual('POST /api/endpoints/:endpointId');
  const trace = segmentSpans(spans, roots[0]);
  expect(trace.some((span) => attribute(span, 'sentry.op') === 'http.client')).toBe(true);
  expectNoPrivateData(trace, markedKey);
  expect(spanCredentialScrubs.size).toBe(0);
});

test('concurrent requests each scrub their spans with their own marked credentials', async () => {
  const keyA = 'runtime-made-app-key-aaaa';
  const keyB = 'runtime-made-app-key-bbbb';
  const { upstream, upstreamPort } = await startUpstream();

  let markedB;
  const bMarked = new Promise((resolve) => {
    markedB = resolve;
  });
  const app = new Hono();
  app.use('*', (c, next) => runInCredentialScope(next));
  app.use('*', sentryMiddleware());
  // The first request's middleware runs before the second's, and its fetch after the second
  // has marked its own key, so a scrub shared between them would miss the first key.
  app.post('/api/endpoints/first', async (c) => {
    markCredential(keyA);
    await bMarked;
    await (await fetch(`http://127.0.0.1:${upstreamPort}/v1/first?app=${keyA}`)).text();
    return c.json({ ok: true });
  });
  app.post('/api/endpoints/second', async (c) => {
    markCredential(keyB);
    markedB();
    await (await fetch(`http://127.0.0.1:${upstreamPort}/v1/second?app=${keyB}`)).text();
    return c.json({ ok: true });
  });
  const server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' });
  const port = await listen(server);
  try {
    const first = fetch(`http://127.0.0.1:${port}/api/endpoints/first`, { method: 'POST' });
    await wait(20);
    const second = fetch(`http://127.0.0.1:${port}/api/endpoints/second`, { method: 'POST' });
    await Promise.all([(await first).text(), (await second).text()]);
    await wait(50);
  } finally {
    await closeServer(server);
    await closeServer(upstream);
  }
  await RealSentry.flush();
  const spans = serverSpans(sentSpans()).flatMap((root) => segmentSpans(sentSpans(), root));
  const clientUrls = spans
    .filter((span) => attribute(span, 'sentry.op') === 'http.client')
    .map((span) => attribute(span, 'url.full'));
  expect(clientUrls).toEqual(
    expect.arrayContaining([
      `http://127.0.0.1:${upstreamPort}/v1/first?app=[REDACTED]`,
      `http://127.0.0.1:${upstreamPort}/v1/second?app=[REDACTED]`,
    ])
  );
  expect(
    serverSpans(spans)
      .map(({ name }) => name)
      .sort()
  ).toEqual(['POST /api/endpoints/first', 'POST /api/endpoints/second']);
  expect(JSON.stringify(spans)).not.toContain(keyA);
  expect(JSON.stringify(spans)).not.toContain(keyB);
  expect(spanCredentialScrubs.size).toBe(0);
});

test('a request whose incoming trace is not sampled sends no spans and leaves no scrub behind', async () => {
  const markedKey = 'runtime-made-app-key-0004';
  const { upstream, upstreamPort } = await startUpstream();
  const server = serve({
    fetch: createTestApp({ upstreamPort, markedKey }).fetch,
    port: 0,
    hostname: '127.0.0.1',
  });
  const port = await listen(server);
  try {
    await postEndpoint({
      port,
      markedKey,
      headers: { 'sentry-trace': `${'e'.repeat(32)}-${'f'.repeat(16)}-0` },
    });
    await wait(100);
  } finally {
    await closeServer(server);
    await closeServer(upstream);
  }
  await RealSentry.flush();
  // Only the test's own outgoing request to the app is sent, as a segment of its own.
  const spans = sentSpans();
  expect(spans.map((span) => [attribute(span, 'sentry.op'), span.is_segment])).toEqual([
    ['http.client', true],
  ]);
  expect(spanCredentialScrubs.size).toBe(0);
});

test('the scrub of an unsampled span is held while it ends and removed once it has ended', () => {
  const scrubRequestCredentials = (value) => value;
  const heldAtSpanEnd = [];
  // Added after initSentry's own hook, so it runs after the scrub has been recorded.
  const removeHook = client.on('spanEnd', (span) => {
    heldAtSpanEnd.push(spanCredentialScrubs.get(span.spanContext().spanId));
  });
  try {
    RealSentry.withIsolationScope((isolationScope) => {
      isolationScope.setSDKProcessingMetadata({ scrubRequestCredentials });
      RealSentry.continueTrace(
        { sentryTrace: `${'1'.repeat(32)}-${'2'.repeat(16)}-0`, baggage: undefined },
        () => {
          RealSentry.startSpan({ name: 'unsampled work' }, (span) => {
            expect(span.spanContext().traceFlags).toBe(0);
          });
        }
      );
    });
  } finally {
    removeHook();
  }
  expect(heldAtSpanEnd).toEqual([scrubRequestCredentials]);
  expect(spanCredentialScrubs.size).toBe(0);
});

// A WebSocket upgrade reaches the app on the server's upgrade event, which Sentry's Http
// integration does not give an isolation scope, and a socket's messages arrive on its connection.
// Each socket here marks its own key while it is upgraded, and a later frame on it fails with an
// error and a span that carry that key, outside the upgrade's credential scope: only the scrub on
// the socket's own isolation scope can reach them. Both sockets are open before either sends a
// frame, so a scrub shared between them would hold the second socket's key alone.
test('concurrent websockets each scrub their errors and spans with their own marked credentials, and a request keeps its scrub', async () => {
  const keyA = 'runtime-made-socket-key-aaaa';
  const keyB = 'runtime-made-socket-key-bbbb';
  const keyC = 'runtime-made-request-key-cccc';
  const app = new Hono();
  app.use('*', (c, next) => runInCredentialScope(next));
  app.use('*', upgradeIsolationScope());
  app.use('*', sentryMiddleware());
  app.use('*', (c, next) => {
    const key = c.req.header('x-test-key');
    markCredential(key);
    const rid = c.req.header('x-test-rid');
    c.set('lowdefyContext', {
      // The caller re-check before a subscribe reads the session, which fails here.
      auth: {
        api: {
          getSession: async () => {
            sentry.startSpan(
              { name: 'session read', attributes: { detail: `read ${key}` } },
              () => {}
            );
            throw new Error(`Session store refused ${key}`);
          },
        },
      },
      config: {},
      i18n: { active: 'en-US', messages: {} },
      rid,
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      handleError: (error) => captureSentryError({ error, context: { rid } }),
      user: null,
    });
    return next();
  });
  app.get('/api/websocket', websocketHandler);
  app.get('/api/websocket', (c) => c.text('Expected a WebSocket upgrade.', 426));
  const wss = new WebSocketServer({ noServer: true });
  const server = serve({
    fetch: app.fetch,
    port: 0,
    hostname: '127.0.0.1',
    websocket: { server: wss },
  });
  const port = await listen(server);

  async function openSocket({ key, rid }) {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/api/websocket`, {
      headers: { 'x-test-key': key, 'x-test-rid': rid },
    });
    await new Promise((resolve) => socket.once('open', resolve));
    return socket;
  }

  function subscribeUntilClosed(socket) {
    const closed = new Promise((resolve) => socket.once('close', (code) => resolve(code)));
    socket.send(JSON.stringify({ type: 'subscribe', websocketId: 'feed', requestId: 's1' }));
    return closed;
  }

  try {
    const socketA = await openSocket({ key: keyA, rid: 'socket-a' });
    const socketB = await openSocket({ key: keyB, rid: 'socket-b' });
    expect(await subscribeUntilClosed(socketA)).toBe(1011);
    expect(await subscribeUntilClosed(socketB)).toBe(1011);
    // A request on the same path that is not an upgrade keeps the scope its root span started in.
    await fetch(`http://127.0.0.1:${port}/api/websocket?ref=${keyC}`, {
      headers: { 'x-test-key': keyC, 'x-test-rid': 'request-c' },
    }).then((response) => response.text());
    await wait(100);
  } finally {
    await closeServer(server);
  }
  await RealSentry.flush();

  const events = sentEvents();
  const eventValues = Object.fromEntries(
    events.map((event) => [event.tags.requestId, event.exception.values[0].value])
  );
  expect(eventValues).toEqual({
    'socket-a': 'Session store refused [REDACTED]',
    'socket-b': 'Session store refused [REDACTED]',
  });
  const spans = sentSpans();
  const sessionReads = spans.filter(({ name }) => name === 'session read');
  expect(sessionReads.map((span) => attribute(span, 'detail'))).toEqual([
    'read [REDACTED]',
    'read [REDACTED]',
  ]);
  const sent = JSON.stringify([events, sessionReads]);
  expect(sent).not.toContain(keyA);
  expect(sent).not.toContain(keyB);

  const roots = serverSpans(spans);
  expect(roots).toHaveLength(1);
  expect(roots[0].name).toEqual('GET /api/websocket');
  expect(attribute(roots[0], 'url.full')).toMatch(/\/api\/websocket\?ref=\[REDACTED\]$/);
  expect(JSON.stringify(segmentSpans(spans, roots[0]))).not.toContain(keyC);
  expect(spanCredentialScrubs.size).toBe(0);
});
