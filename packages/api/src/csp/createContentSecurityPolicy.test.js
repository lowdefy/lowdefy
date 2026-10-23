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

import createContentSecurityPolicy from './createContentSecurityPolicy.js';
import { expect, test } from 'vitest';

const policy = {
  reportOnly: false,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
  },
  nonceDirectives: ['script-src', 'style-src'],
  websockets: false,
};

test('createContentSecurityPolicy adds the nonce to the nonce directives only', () => {
  const { name, nonce, value } = createContentSecurityPolicy({
    policy,
    requestUrl: 'https://app.example.com/page',
    allowWebSocket: false,
  });
  expect(name).toEqual('Content-Security-Policy');
  expect(value).toEqual(
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; connect-src 'self'; object-src 'none'`
  );
});

test('createContentSecurityPolicy draws a new nonce of at least 128 bits on every call', () => {
  const first = createContentSecurityPolicy({
    policy,
    requestUrl: 'https://app.example.com/',
    allowWebSocket: false,
  });
  const second = createContentSecurityPolicy({
    policy,
    requestUrl: 'https://app.example.com/',
    allowWebSocket: false,
  });
  expect(first.nonce).not.toEqual(second.nonce);
  expect(Buffer.from(first.nonce, 'base64').length).toBeGreaterThanOrEqual(16);
});

test('createContentSecurityPolicy uses the report-only header when reportOnly is true', () => {
  const { name } = createContentSecurityPolicy({
    policy: { ...policy, reportOnly: true },
    requestUrl: 'https://app.example.com/',
    allowWebSocket: false,
  });
  expect(name).toEqual('Content-Security-Policy-Report-Only');
});

test('createContentSecurityPolicy leaves out the nonce for a directive not in nonceDirectives', () => {
  const { value } = createContentSecurityPolicy({
    policy: {
      ...policy,
      directives: { ...policy.directives, 'style-src': ["'self'", "'unsafe-inline'"] },
      nonceDirectives: ['script-src'],
    },
    requestUrl: 'https://app.example.com/',
    allowWebSocket: false,
  });
  expect(value).toContain("style-src 'self' 'unsafe-inline';");
});

test('createContentSecurityPolicy adds the wss origin of an https page to connect-src', () => {
  const { value } = createContentSecurityPolicy({
    policy,
    requestUrl: 'https://app.example.com/page',
    allowWebSocket: true,
  });
  expect(value).toContain("connect-src 'self' wss://app.example.com;");
});

test('createContentSecurityPolicy adds ws and wss origins with the port for an http page', () => {
  const { value } = createContentSecurityPolicy({
    policy,
    requestUrl: 'http://localhost:3122/page',
    allowWebSocket: true,
  });
  expect(value).toContain("connect-src 'self' ws://localhost:3122 wss://localhost:3122;");
});

test('createContentSecurityPolicy adds no websocket origin when allowWebSocket is false', () => {
  const { value } = createContentSecurityPolicy({
    policy,
    requestUrl: 'https://app.example.com/page',
    allowWebSocket: false,
  });
  expect(value).toContain("connect-src 'self';");
});
