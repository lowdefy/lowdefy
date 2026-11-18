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

import { vi, expect, test } from 'vitest';

import isWebSocketOriginAllowed from './isWebSocketOriginAllowed.js';

function createContext({ config = {}, trustedOrigins } = {}) {
  return {
    auth: { options: { trustedOrigins } },
    config,
    logger: { warn: vi.fn() },
  };
}

function check({ context, headers }) {
  return isWebSocketOriginAllowed({ context, getHeader: (name) => headers[name] });
}

test.each([
  [
    'the environment url',
    { config: { environment: 'prod', environments: { prod: { url: 'https://app.example.com' } } } },
  ],
  ['an auth trusted origin', { trustedOrigins: ['https://app.example.com'] }],
])('isWebSocketOriginAllowed accepts %s behind a proxy that rewrites Host', (_, options) => {
  const context = createContext(options);
  const headers = { host: 'localhost:3000', origin: 'https://app.example.com' };
  expect(check({ context, headers })).toBe(true);
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('isWebSocketOriginAllowed logs the Origin and Host of a refused upgrade', () => {
  const context = createContext();
  const headers = { host: 'app.test', origin: 'https://other.test' };
  expect(check({ context, headers })).toBe(false);
  expect(context.logger.warn).toHaveBeenCalledWith(
    expect.objectContaining({
      event: 'ws_origin_refused',
      origin: 'https://other.test',
      host: 'app.test',
    }),
    expect.stringContaining('X-Forwarded-Host')
  );
});

test('isWebSocketOriginAllowed accepts a phone shell upgrade that sends a bearer and no Origin', () => {
  const context = createContext();
  const headers = { host: 'app.example.com', authorization: 'Bearer tok.sig' };
  expect(check({ context, headers })).toBe(true);
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('isWebSocketOriginAllowed refuses a foreign page even when it names a bearer', () => {
  const context = createContext();
  const headers = {
    host: 'app.example.com',
    origin: 'https://evil.example.org',
    authorization: 'Bearer tok.sig',
  };
  expect(check({ context, headers })).toBe(false);
});

const viewOrigin = 'https://0123456789abcdef0123456789abcdef.claudemcpcontent.com';

function checkView({ context, headers, viewOrigins }) {
  return isWebSocketOriginAllowed({
    context,
    getHeader: (name) => headers[name],
    viewOrigins,
  });
}

test('isWebSocketOriginAllowed accepts a view origin, which is another site', () => {
  const context = createContext();
  const headers = { host: 'app.test', origin: viewOrigin, 'sec-fetch-site': 'cross-site' };
  expect(checkView({ context, headers, viewOrigins: [viewOrigin] })).toBe(true);
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('isWebSocketOriginAllowed refuses a view origin when the server passes no view origins', () => {
  const context = createContext();
  const headers = { host: 'app.test', origin: viewOrigin };
  expect(check({ context, headers })).toBe(false);
  expect(checkView({ context, headers, viewOrigins: [] })).toBe(false);
});

test.each([
  ['a subdomain of the view origin', viewOrigin.replace('https://', 'https://x.')],
  ['the view domain over http', viewOrigin.replace('https://', 'http://')],
  ['another site', 'https://other.test'],
])('isWebSocketOriginAllowed refuses %s beside a view origin', (_, origin) => {
  const context = createContext();
  const headers = { host: 'app.test', origin };
  expect(checkView({ context, headers, viewOrigins: [viewOrigin] })).toBe(false);
});

test('isWebSocketOriginAllowed still accepts the app page and no Origin beside a view origin', () => {
  const context = createContext();
  expect(
    checkView({
      context,
      headers: { host: 'app.test', origin: 'https://app.test' },
      viewOrigins: [viewOrigin],
    })
  ).toBe(true);
  expect(checkView({ context, headers: { host: 'app.test' }, viewOrigins: [viewOrigin] })).toBe(
    true
  );
});
