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

import handleMobileSignIn from './handleMobileSignIn.js';

const authJson = {
  authPages: { signIn: '/login' },
  mobile: { shells: [{ id: 'field', scheme: 'com.example.field' }], sessionExpiresIn: null },
};

function createAuth({ session = null } = {}) {
  const adapter = { update: jest.fn() };
  return {
    adapter,
    auth: {
      api: {
        getSession: jest.fn(async () => session),
        generateOneTimeToken: jest.fn(async () => ({ token: 'one-time' })),
      },
      $context: Promise.resolve({ adapter }),
    },
  };
}

function request(path) {
  return new Request(`http://localhost${path}`, { headers: { cookie: 'a=b' } });
}

test('handleMobileSignIn answers 404 when auth is not configured', async () => {
  const response = await handleMobileSignIn({
    auth: null,
    authJson,
    basePath: '',
    request: request('/auth/mobile?shell=field&state=s'),
  });
  expect(response.status).toBe(404);
});

test.each([
  ['/auth/mobile?state=s'],
  ['/auth/mobile?shell=other&state=s'],
  ['/auth/mobile?shell=field'],
  [`/auth/mobile?shell=field&state=${'s'.repeat(513)}`],
])('handleMobileSignIn answers 400 to %s', async (path) => {
  const { auth } = createAuth();
  const response = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: request(path),
  });
  expect(response.status).toBe(400);
  expect(auth.api.getSession).not.toHaveBeenCalled();
});

test('handleMobileSignIn answers 400 for an app with no mobile section', async () => {
  const { auth } = createAuth();
  const response = await handleMobileSignIn({
    auth,
    authJson: { authPages: { signIn: '/login' } },
    basePath: '',
    request: request('/auth/mobile?shell=field&state=s'),
  });
  expect(response.status).toBe(400);
});

test('handleMobileSignIn sends a signed-out person to the sign-in page under the basePath', async () => {
  const { auth } = createAuth();
  const response = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '/app',
    request: request('/app/auth/mobile?shell=field&state=s%201'),
  });
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(
    `/app/login?callbackUrl=${encodeURIComponent('/app/auth/mobile?shell=field&state=s%201')}`
  );
  expect(auth.api.getSession).toHaveBeenCalledWith({
    headers: expect.any(Headers),
    query: { disableCookieCache: true },
  });
});

test('handleMobileSignIn redirects a signed-in person to the shell scheme with a one-time token', async () => {
  const { adapter, auth } = createAuth({ session: { session: { id: 's1' }, user: { id: 'u1' } } });
  const response = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '',
    request: request('/auth/mobile?shell=field&state=a%26b'),
  });
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(
    'com.example.field://auth?token=one-time&state=a%26b'
  );
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  expect(adapter.update).not.toHaveBeenCalled();
});

test('handleMobileSignIn gives the handed-on session the phone lifetime when one is set', async () => {
  const { adapter, auth } = createAuth({ session: { session: { id: 's1' }, user: { id: 'u1' } } });
  await handleMobileSignIn({
    auth,
    authJson: { ...authJson, mobile: { ...authJson.mobile, sessionExpiresIn: 60 } },
    basePath: '',
    request: request('/auth/mobile?shell=field&state=s'),
  });
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'session',
    where: [{ field: 'id', value: 's1' }],
    update: { mobile: true, expiresAt: expect.any(Date) },
  });
});
