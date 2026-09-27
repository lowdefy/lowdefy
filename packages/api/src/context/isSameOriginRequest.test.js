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

function check({ headers, allowNoOrigin }) {
  return isSameOriginRequest({ getHeader: (name) => headers[name], allowNoOrigin });
}

test.each([
  ['the origin matches the host', { host: 'app.test', origin: 'https://app.test' }],
  [
    'the origin and host carry the same port',
    { host: 'app.test:3000', origin: 'http://app.test:3000' },
  ],
  [
    'sec-fetch-site is same-origin',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'same-origin' },
  ],
  [
    'sec-fetch-site is none',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'none' },
  ],
  [
    'a proxy passes the public host through',
    { host: 'app.example.com', origin: 'https://app.example.com', 'x-forwarded-for': '10.0.0.1' },
  ],
])('isSameOriginRequest allows a request when %s', (_, headers) => {
  expect(check({ headers })).toBe(true);
});

test.each([
  ['the origin is another site', { host: 'app.test', origin: 'https://other.test' }],
  ['the origin is a sibling subdomain', { host: 'app.test', origin: 'https://sub.app.test' }],
  ['the origin port differs', { host: 'app.test:3000', origin: 'http://app.test:3001' }],
  ['the origin is not a url', { host: 'app.test', origin: 'not a url' }],
  ['the origin is "null"', { host: 'app.test', origin: 'null' }],
  ['there is no host', { origin: 'https://app.test' }],
  [
    'a proxy rewrote the host',
    {
      host: 'localhost:3000',
      origin: 'https://app.example.com',
      'x-forwarded-host': 'app.example.com',
    },
  ],
  [
    'sec-fetch-site is cross-site',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'cross-site' },
  ],
  [
    'sec-fetch-site is same-site',
    { host: 'app.test', origin: 'https://app.test', 'sec-fetch-site': 'same-site' },
  ],
])('isSameOriginRequest refuses a request when %s', (_, headers) => {
  expect(check({ headers, allowNoOrigin: true })).toBe(false);
});

test.each([
  [true, true],
  [false, false],
  [undefined, false],
])(
  'isSameOriginRequest with no origin and allowNoOrigin %s returns %s',
  (allowNoOrigin, expected) => {
    expect(check({ headers: { host: 'app.test' }, allowNoOrigin })).toBe(expected);
  }
);

test('isSameOriginRequest refuses a cross-site sec-fetch-site even with no origin', () => {
  expect(
    check({ headers: { host: 'app.test', 'sec-fetch-site': 'cross-site' }, allowNoOrigin: true })
  ).toBe(false);
});
