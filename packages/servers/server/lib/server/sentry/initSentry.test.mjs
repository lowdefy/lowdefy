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

import { jest } from '@jest/globals';
import * as RealSentry from '@sentry/node';

const secret = 'planted/secret+value=1';

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
// event Sentry would send, after the hooks initSentry installs.
jest.unstable_mockModule('@sentry/node', () => ({
  ...RealSentry,
  init: (options) => RealSentry.init({ ...options, transport: createStubTransport }),
  httpIntegration: (options) => {
    const integration = RealSentry.httpIntegration(options);
    httpIntegrations.push(integration);
    return integration;
  },
}));
jest.unstable_mockModule('../../build/logger.js', () => ({ default: { sentry: {} } }));

process.env.SENTRY_DSN = 'https://public@o0.ingest.sentry.io/1';
process.env.LOWDEFY_SECRET_API_KEY = secret;

const { default: initSentryServer } = await import('./initSentry.js');

const enabled = initSentryServer();
const client = RealSentry.getClient();
const options = client.getOptions();

function sentEvents() {
  return envelopes.flatMap(([, items]) =>
    items.filter(([header]) => header.type === 'event').map(([, payload]) => payload)
  );
}

beforeEach(() => {
  envelopes.length = 0;
});

afterAll(async () => {
  await RealSentry.close();
});

test('initSentry initializes Sentry when SENTRY_DSN is set', () => {
  expect(enabled).toBe(true);
  expect(client).toBeDefined();
});

test('initSentry installs exactly one Http integration, the one that attaches no request bodies', () => {
  expect(httpIntegrations).toHaveLength(1);
  const installedHttp = options.integrations.filter(({ name }) => name === 'Http');
  expect(installedHttp).toHaveLength(1);
  expect(installedHttp[0]).toBe(httpIntegrations[0]);
  expect(client.getIntegrationByName('Http')).toBe(httpIntegrations[0]);
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

function createFetchSpan() {
  return {
    span_id: 'b'.repeat(16),
    trace_id: 'c'.repeat(32),
    parent_span_id: 'd'.repeat(16),
    op: 'http.client',
    description: `GET https://api.example.com/v1/items?api_key=${secret}`,
    origin: 'auto.http.otel.node_fetch',
    start_timestamp: 1700000000,
    timestamp: 1700000001,
    status: 'ok',
    data: {
      'sentry.op': 'http.client',
      'http.method': 'GET',
      url: `https://api.example.com/v1/items?api_key=${secret}`,
      'http.url': `https://api.example.com/v1/items?api_key=${secret}`,
      'http.query': `?api_key=${secret}`,
      'http.response.status_code': 200,
    },
  };
}

test('beforeSendSpan replaces a planted secret in a fetch span http.url and http.query', () => {
  const scrubbed = options.beforeSendSpan(createFetchSpan());
  expect(JSON.stringify(scrubbed)).not.toContain(secret);
  expect(scrubbed.data['http.url']).toEqual('https://api.example.com/v1/items?api_key=[REDACTED]');
  expect(scrubbed.data['http.query']).toEqual('?api_key=[REDACTED]');
  expect(scrubbed.data['http.response.status_code']).toEqual(200);
});

test('beforeSendTransaction replaces a planted secret in a fetch span http.url and http.query', () => {
  const transaction = {
    type: 'transaction',
    transaction: 'POST /api/endpoints/fetch-items',
    start_timestamp: 1700000000,
    timestamp: 1700000002,
    contexts: {
      trace: { span_id: 'd'.repeat(16), trace_id: 'c'.repeat(32), op: 'http.server' },
    },
    spans: [createFetchSpan()],
  };
  const scrubbed = options.beforeSendTransaction(transaction, {});
  expect(JSON.stringify(scrubbed)).not.toContain(secret);
  expect(scrubbed.spans[0].data['http.url']).toEqual(
    'https://api.example.com/v1/items?api_key=[REDACTED]'
  );
  expect(scrubbed.spans[0].data['http.query']).toEqual('?api_key=[REDACTED]');
  expect(scrubbed.contexts).toEqual(transaction.contexts);
});

test('an error event captured during a request with a JSON body carries no request data', async () => {
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      RealSentry.captureException(new Error('Endpoint failed.'));
      res.end('{}');
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/endpoints/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'planted-user-password' }),
    });
    await response.text();
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  await RealSentry.flush();
  const events = sentEvents();
  expect(events).toHaveLength(1);
  expect(events[0].request.url).toMatch(/\/api\/endpoints\/sign-in$/);
  expect(events[0].request.data).toBeUndefined();
  expect(JSON.stringify(events[0])).not.toContain('planted-user-password');
});
