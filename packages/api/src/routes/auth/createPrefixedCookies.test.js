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

import createPrefixedCookies, { slugifyPrefix } from './createPrefixedCookies.js';

test('slugifyPrefix lowercases, replaces non-alphanumeric runs, and trims dashes', () => {
  expect(slugifyPrefix('My App')).toBe('my-app');
  expect(slugifyPrefix('  Foo__Bar!! ')).toBe('foo-bar');
  expect(slugifyPrefix('already-slug')).toBe('already-slug');
});

test('createPrefixedCookies injects the prefix into all six cookie names without secure prefixes', () => {
  const cookies = createPrefixedCookies({ prefix: 'ld-myapp', useSecureCookies: false });
  expect(cookies.sessionToken.name).toBe('ld-myapp.next-auth.session-token');
  expect(cookies.callbackUrl.name).toBe('ld-myapp.next-auth.callback-url');
  expect(cookies.csrfToken.name).toBe('ld-myapp.next-auth.csrf-token');
  expect(cookies.pkceCodeVerifier.name).toBe('ld-myapp.next-auth.pkce.code_verifier');
  expect(cookies.state.name).toBe('ld-myapp.next-auth.state');
  expect(cookies.nonce.name).toBe('ld-myapp.next-auth.nonce');
});

test('createPrefixedCookies applies __Secure- and __Host- prefixes when secure', () => {
  const cookies = createPrefixedCookies({ prefix: 'ld-myapp', useSecureCookies: true });
  expect(cookies.sessionToken.name).toBe('__Secure-ld-myapp.next-auth.session-token');
  expect(cookies.csrfToken.name).toBe('__Host-ld-myapp.next-auth.csrf-token');
  expect(cookies.nonce.name).toBe('__Secure-ld-myapp.next-auth.nonce');
});

test('createPrefixedCookies sets options matching next-auth defaults', () => {
  const cookies = createPrefixedCookies({ prefix: 'p', useSecureCookies: true });
  expect(cookies.sessionToken.options).toEqual({
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: true,
  });
  expect(cookies.pkceCodeVerifier.options).toEqual({
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: true,
    maxAge: 60 * 15,
  });
  expect(cookies.state.options.maxAge).toBe(60 * 15);
});

test('createPrefixedCookies returns a fresh options object per cookie', () => {
  const cookies = createPrefixedCookies({ prefix: 'p', useSecureCookies: false });
  expect(cookies.sessionToken.options).not.toBe(cookies.callbackUrl.options);
});
