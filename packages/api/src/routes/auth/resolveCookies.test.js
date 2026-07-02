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

import resolveCookies from './resolveCookies.js';

const originalAuthUrl = process.env.AUTH_URL;
const originalNextAuthUrl = process.env.NEXTAUTH_URL;

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

beforeEach(() => {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
});

afterEach(() => {
  restoreEnv('AUTH_URL', originalAuthUrl);
  restoreEnv('NEXTAUTH_URL', originalNextAuthUrl);
});

test('resolveCookies returns undefined in production with no config (Auth.js defaults)', () => {
  const result = resolveCookies({
    appMeta: { slug: 'my-app', name: 'My App' },
    authConfig: {},
    dev: false,
  });
  expect(result).toBeUndefined();
});

test('resolveCookies uses an explicit cookies object verbatim, even in dev', () => {
  const cookies = { sessionToken: { name: 'custom', options: {} } };
  const result = resolveCookies({
    appMeta: { slug: 'my-app' },
    authConfig: { advanced: { cookies } },
    dev: true,
  });
  expect(result).toBe(cookies);
});

test('resolveCookies prefixes from app slug when running the dev server', () => {
  const result = resolveCookies({
    appMeta: { slug: 'my-app', name: 'My App' },
    authConfig: {},
    dev: true,
  });
  expect(result.sessionToken.name).toBe('my-app.authjs.session-token');
});

test('resolveCookies falls back to app name when slug is missing in dev', () => {
  const result = resolveCookies({
    appMeta: { name: 'My App' },
    authConfig: {},
    dev: true,
  });
  expect(result.sessionToken.name).toBe('my-app.authjs.session-token');
});

test('resolveCookies returns undefined in dev when app has no slug or name', () => {
  const result = resolveCookies({
    appMeta: {},
    authConfig: {},
    dev: true,
  });
  expect(result).toBeUndefined();
});

test('resolveCookies returns undefined in dev when slug and name are null', () => {
  const result = resolveCookies({
    appMeta: { slug: null, name: null },
    authConfig: {},
    dev: true,
  });
  expect(result).toBeUndefined();
});

test('resolveCookies honors an explicit cookiePrefix even outside dev', () => {
  const result = resolveCookies({
    appMeta: { slug: 'my-app' },
    authConfig: { advanced: { cookiePrefix: 'custom' } },
    dev: false,
  });
  expect(result.sessionToken.name).toBe('custom.authjs.session-token');
});

test('resolveCookies applies secure prefixes when AUTH_URL is https', () => {
  process.env.AUTH_URL = 'https://example.com';
  const result = resolveCookies({
    appMeta: { slug: 'my-app' },
    authConfig: { advanced: { cookiePrefix: 'custom' } },
    dev: false,
  });
  expect(result.sessionToken.name).toBe('__Secure-custom.authjs.session-token');
  expect(result.csrfToken.name).toBe('__Host-custom.authjs.csrf-token');
});

test('resolveCookies applies secure prefixes when only NEXTAUTH_URL is https', () => {
  process.env.NEXTAUTH_URL = 'https://example.com';
  const result = resolveCookies({
    appMeta: { slug: 'my-app' },
    authConfig: { advanced: { cookiePrefix: 'custom' } },
    dev: false,
  });
  expect(result.sessionToken.name).toBe('__Secure-custom.authjs.session-token');
});
