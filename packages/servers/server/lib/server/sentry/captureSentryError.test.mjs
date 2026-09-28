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
import { RequestError } from '@lowdefy/errors';

const captureException = jest.fn();

jest.unstable_mockModule('@sentry/node', () => ({ captureException }));

process.env.SENTRY_DSN = 'https://public@o0.ingest.sentry.io/1';

const { default: captureSentryError } = await import('./captureSentryError.js');

function createAxiosError() {
  const error = new Error('Request failed with status code 401');
  error.name = 'AxiosError';
  error.code = 'ERR_BAD_REQUEST';
  error.config = {
    auth: { username: 'svc-user', password: 'planted-config-password' },
    params: { api_key: 'planted-config-param' },
    headers: { Authorization: 'Bearer planted-config-header' },
    baseURL: 'https://api.example.com',
  };
  error.response = { status: 401, data: { detail: 'planted-response-body' } };
  return error;
}

function createRequestError() {
  return new RequestError(undefined, {
    cause: createAxiosError(),
    typeName: 'AxiosHttp',
    configKey: 'key-1',
    received: {
      url: 'https://api.example.com/items',
      headers: { Authorization: 'Bearer runtime-token', Accept: 'application/json' },
    },
  });
}

test('captureSentryError sends the log projection as extra.error, without axios config and with received credential keys masked', () => {
  const error = createRequestError();
  captureSentryError({ error, context: { rid: 'req-1', pageId: 'orders' } });
  expect(captureException).toHaveBeenCalledTimes(1);
  const [captured, { extra }] = captureException.mock.calls[0];
  expect(captured).toBe(error);
  expect(extra.error.typeName).toEqual('AxiosHttp');
  expect(extra.error.statusCode).toEqual(401);
  expect(extra.error.received).toEqual({
    url: 'https://api.example.com/items',
    headers: { Authorization: '[REDACTED]', Accept: 'application/json' },
  });
  expect(extra.error.cause).toEqual({
    name: 'AxiosError',
    message: 'Request failed with status code 401',
    stack: expect.any(String),
    code: 'ERR_BAD_REQUEST',
    statusCode: 401,
  });
  expect(JSON.stringify(extra)).not.toMatch(/planted|runtime-token/);
});

test('captureSentryError tags the request id and keeps configKey and configLocation in extra', () => {
  const configLocation = { source: 'pages/orders.yaml:12', config: 'root.pages[0]' };
  captureSentryError({
    error: createRequestError(),
    context: { rid: 'req-1', pageId: 'orders' },
    configLocation,
  });
  const [, { tags, extra }] = captureException.mock.calls[0];
  expect(tags).toEqual({ pageId: 'orders', requestId: 'req-1' });
  expect(extra.configKey).toEqual('key-1');
  expect(extra.configLocation).toEqual(configLocation);
});

test('captureSentryError leaves out the requestId tag when the context has no request id', () => {
  captureSentryError({ error: new Error('Failed.'), context: {} });
  const [, { tags }] = captureException.mock.calls[0];
  expect(Object.keys(tags)).not.toContain('requestId');
});

test('captureSentryError does nothing when SENTRY_DSN is not set', () => {
  const dsn = process.env.SENTRY_DSN;
  delete process.env.SENTRY_DSN;
  try {
    captureSentryError({ error: new Error('Failed.'), context: { rid: 'req-1' } });
  } finally {
    process.env.SENTRY_DSN = dsn;
  }
  expect(captureException).not.toHaveBeenCalled();
});
