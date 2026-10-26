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

import { vi, beforeEach, expect, test } from 'vitest';
import { operatorsServer } from '@lowdefy/operators-js';

import runLinkEndpoint from './runLinkEndpoint.js';
import testContext from '../../test/testContext.js';

const logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

const presign = {
  ':return': {
    '_string.concat': [
      'https://bucket.s3.amazonaws.com/',
      { _payload: 'path' },
      '?X-Amz-Signature=sig',
    ],
  },
};

function createContext({ endpoints, authEnforcement = null, user = null, system } = {}) {
  const linkEndpoints = Object.values(endpoints)
    .filter((endpoint) => endpoint.link === true)
    .map((endpoint) => ({
      endpointId: endpoint.endpointId,
      segments: endpoint.endpointId.split('/'),
    }))
    .sort((a, b) => b.segments.length - a.segments.length);
  return testContext({
    authEnforcement,
    logger,
    operators: operatorsServer,
    readConfigFile: vi.fn(async (path) => {
      if (path === 'linkEndpoints.json') return linkEndpoints;
      return endpoints[path.slice(4, -5)] ?? null;
    }),
    system,
    user,
  });
}

function linkEndpoint(endpointId, config) {
  return { endpointId, type: 'Api', link: true, auth: { public: false }, ...config };
}

const protectedApp = { public: false };

test('a signed-in GET answers 302 to the URL the routine returns, with path and query', async () => {
  const endpoints = {
    files: linkEndpoint('files', {
      routine: {
        ':return': {
          '_string.concat': [
            'https://bucket.s3.amazonaws.com/',
            { _payload: 'path' },
            '?v=',
            { _payload: 'query.v' },
          ],
        },
      },
    }),
  };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  const answer = await runLinkEndpoint(context, {
    segments: ['files', 'log-events', 'x.png'],
    query: { v: '2' },
  });
  expect(answer).toEqual({
    status: 302,
    location: 'https://bucket.s3.amazonaws.com/log-events/x.png?v=2',
  });
  expect(logger.info).toHaveBeenCalledWith({ event: 'call_link_endpoint', endpointId: 'files' });
});

test('a nested endpoint id and a multi-segment path resolve by the longest prefix', async () => {
  const endpoints = {
    a: linkEndpoint('a', { routine: { ':return': '/wrong' } }),
    'a/b': linkEndpoint('a/b', { routine: presign }),
  };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  const answer = await runLinkEndpoint(context, {
    segments: ['a', 'b', 'log-events', '2024', 'x y+z.png'],
    query: {},
  });
  expect(answer).toEqual({
    status: 302,
    location: 'https://bucket.s3.amazonaws.com/log-events/2024/x y+z.png?X-Amz-Signature=sig',
  });
});

test('a path on this origin is a valid link target', async () => {
  const endpoints = { files: linkEndpoint('files', { routine: { ':return': '/public/x.png' } }) };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  expect(await runLinkEndpoint(context, { segments: ['files'], query: {} })).toEqual({
    status: 302,
    location: '/public/x.png',
  });
});

test('a signed-out GET on a protected link endpoint answers 401 with no body', async () => {
  const endpoints = { files: linkEndpoint('files', { routine: presign }) };
  const context = createContext({ endpoints, authEnforcement: protectedApp });
  expect(await runLinkEndpoint(context, { segments: ['files', 'x.png'], query: {} })).toEqual({
    status: 401,
  });
});

test('a caller without the endpoint roles answers 403 with no body', async () => {
  const endpoints = {
    files: linkEndpoint('files', { auth: { public: false, roles: ['admin'] }, routine: presign }),
  };
  const context = createContext({
    endpoints,
    authEnforcement: protectedApp,
    user: { id: 'u1', roles: ['viewer'] },
  });
  expect(await runLinkEndpoint(context, { segments: ['files', 'x.png'], query: {} })).toEqual({
    status: 403,
  });
});

test('a public link endpoint answers a signed-out GET', async () => {
  const endpoints = { files: linkEndpoint('files', { auth: { public: true }, routine: presign }) };
  const context = createContext({ endpoints, authEnforcement: protectedApp });
  const answer = await runLinkEndpoint(context, { segments: ['files', 'x.png'], query: {} });
  expect(answer.status).toBe(302);
});

test('a GET that names no link endpoint answers 404', async () => {
  const endpoints = {
    files: linkEndpoint('files', { routine: presign }),
    plain: { endpointId: 'plain', type: 'Api', auth: { public: true }, routine: presign },
  };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  expect(await runLinkEndpoint(context, { segments: ['unknown', 'x.png'], query: {} })).toEqual({
    status: 404,
    body: { error: 'Not found.' },
  });
  // A non-link endpoint is never matched, so a GET cannot run it.
  expect(await runLinkEndpoint(context, { segments: ['plain', 'x.png'], query: {} })).toEqual({
    status: 404,
    body: { error: 'Not found.' },
  });
});

test('a GET that names no link endpoint answers 404 on an app without auth', async () => {
  const context = createContext({ endpoints: {} });
  expect(await runLinkEndpoint(context, { segments: ['unknown'], query: {} })).toEqual({
    status: 404,
    body: { error: 'Not found.' },
  });
});

test('a signed-out GET that names no link endpoint answers 401, as a protected one does', async () => {
  const context = createContext({ endpoints: {}, authEnforcement: protectedApp });
  expect(await runLinkEndpoint(context, { segments: ['unknown', 'x.png'], query: {} })).toEqual({
    status: 401,
  });
});

test('a :reject answers its :status with no body', async () => {
  const endpoints = {
    files: linkEndpoint('files', { routine: { ':reject': 'Not yours.', ':status': 404 } }),
  };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  expect(await runLinkEndpoint(context, { segments: ['files', 'x.png'], query: {} })).toEqual({
    status: 404,
  });
});

test('a :reject without :status answers 400 with no body', async () => {
  const endpoints = { files: linkEndpoint('files', { routine: { ':reject': 'Not yours.' } }) };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  expect(await runLinkEndpoint(context, { segments: ['files', 'x.png'], query: {} })).toEqual({
    status: 400,
  });
});

test('a :reject in an InternalApi endpoint the routine calls sets the status', async () => {
  const endpoints = {
    files: linkEndpoint('files', {
      routine: {
        id: 'endpoint:files:check',
        stepId: 'check',
        type: 'CallApi',
        properties: { endpointId: 'check' },
      },
    }),
    check: {
      endpointId: 'check',
      type: 'InternalApi',
      auth: { public: true },
      routine: { ':reject': 'Gone.', ':status': 410 },
    },
  };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  expect(await runLinkEndpoint(context, { segments: ['files', 'x.png'], query: {} })).toEqual({
    status: 410,
  });
});

test('a thrown error answers 500 with a fixed message', async () => {
  const endpoints = {
    files: linkEndpoint('files', { routine: { ':throw': 'Bucket key secret-key leaked.' } }),
  };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  expect(await runLinkEndpoint(context, { segments: ['files', 'x.png'], query: {} })).toEqual({
    status: 500,
    body: { error: 'Link failed.' },
  });
});

test.each([
  ['an object', { url: 'https://x.test/a.png' }],
  ['an empty string', ''],
  ['nothing', null],
  ['a relative path', 'x.png'],
  ['a protocol-relative URL', '//evil.test/x.png'],
  ['a backslash host', '/\\evil.test/x.png'],
  ['a javascript URL', 'javascript:alert(1)'],
  ['a URL with a line break', 'https://x.test/a.png\r\nSet-Cookie: a=b'],
])('a :return of %s answers 500 and logs a ConfigError naming the endpoint', async (_, value) => {
  const endpoints = { files: linkEndpoint('files', { routine: { ':return': value } }) };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  expect(await runLinkEndpoint(context, { segments: ['files', 'x.png'], query: {} })).toEqual({
    status: 500,
    body: { error: 'Link failed.' },
  });
  const [error] = logger.error.mock.calls.at(-1);
  expect(error.name).toBe('ConfigError');
  expect(error.message).toBe(
    'Link endpoint "files" must return a URL: an absolute http(s) URL or a path starting with "/".'
  );
});

test('a payloadSchema validates the { path, query } payload', async () => {
  const endpoints = {
    files: linkEndpoint('files', {
      payloadSchema: {
        type: 'object',
        properties: { path: { type: 'string', pattern: '^log-events/' } },
      },
      routine: presign,
    }),
  };
  const context = createContext({ endpoints, authEnforcement: protectedApp, user: { id: 'u1' } });
  const ok = await runLinkEndpoint(context, {
    segments: ['files', 'log-events', 'x.png'],
    query: {},
  });
  expect(ok.status).toBe(302);
  expect(
    await runLinkEndpoint(context, { segments: ['files', 'other', 'x.png'], query: {} })
  ).toEqual({ status: 400 });
});
