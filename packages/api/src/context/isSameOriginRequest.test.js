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

import isSameOriginRequest from './isSameOriginRequest.js';

function check({ headers, ...options }) {
  return isSameOriginRequest({ getHeader: (name) => headers[name], ...options });
}

test.each([
  ['the origin matches the host', { host: 'app.test', origin: 'https://app.test' }],
  ['case and a default port differ', { host: 'App.test:443', origin: 'https://app.TEST' }],
  [
    'sec-fetch-site is same-origin',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'same-origin' },
  ],
])('isSameOriginRequest allows a request when %s', (_, headers) => {
  expect(check({ headers })).toBe(true);
});

test.each([
  ['the origin is another site', { host: 'app.test', origin: 'https://other.test' }],
  ['the origin is not a url', { host: 'app.test', origin: 'null' }],
  ['a non-default port differs', { host: 'app.test:3000', origin: 'http://app.test:3001' }],
  [
    'sec-fetch-site is cross-site',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'cross-site' },
  ],
])('isSameOriginRequest refuses a request when %s', (_, headers) => {
  expect(check({ headers, allowNoOrigin: true })).toBe(false);
});

test.each([
  [true, true],
  [false, false],
])(
  'isSameOriginRequest with no origin and allowNoOrigin %s returns %s',
  (allowNoOrigin, expected) => {
    expect(check({ headers: { host: 'app.test' }, allowNoOrigin })).toBe(expected);
  }
);

test('isSameOriginRequest matches the first X-Forwarded-Host only where the caller accepts it', () => {
  // A proxy that rewrites Host to its upstream, and appends to the header.
  const headers = {
    host: 'localhost:3000',
    origin: 'https://app.example.com',
    'x-forwarded-host': 'app.example.com, internal.proxy',
  };
  expect(check({ headers })).toBe(false);
  expect(check({ headers, acceptForwardedHost: true })).toBe(true);
});

test('isSameOriginRequest matches a configured public origin', () => {
  const headers = { host: 'localhost:3000', origin: 'https://app.example.com' };
  expect(check({ headers, publicOrigins: ['https://app.example.com/'] })).toBe(true);
  expect(check({ headers, publicOrigins: ['https://other.example.com'] })).toBe(false);
});
