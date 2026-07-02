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
import createAuthMethods from './createAuthMethods.js';

function setup({ signUpResult } = {}) {
  const assign = jest.fn();
  const lowdefy = {
    _internal: {
      globals: { window: { location: { assign, search: '' } } },
    },
  };
  const auth = {
    authConfig: { providers: [] },
    signInEmail: jest.fn(() => Promise.resolve({ data: { token: 't' }, error: null })),
    signUpEmail: jest.fn(() =>
      Promise.resolve({ data: signUpResult ?? { token: null, user: {} }, error: null })
    ),
  };
  return { auth, lowdefy, assign };
}

test('signUp calls signUpEmail with email, password, name and callbackURL', async () => {
  const { auth, lowdefy } = setup();
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({
    email: 'user@example.com',
    password: 'password123',
    name: 'User',
    callbackUrl: { url: '/verified' },
  });
  expect(auth.signUpEmail.mock.calls).toEqual([
    [
      {
        email: 'user@example.com',
        password: 'password123',
        name: 'User',
        callbackURL: '/verified',
      },
    ],
  ]);
});

test('signUp does not navigate on a session-less response (verify-email state)', async () => {
  const { auth, lowdefy, assign } = setup({ signUpResult: { token: null, user: {} } });
  const { signUp } = createAuthMethods(lowdefy, auth);
  const data = await signUp({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/verified' },
  });
  expect(assign).not.toHaveBeenCalled();
  expect(data).toEqual({ token: null, user: {} });
});

test('signUp navigates to callbackURL when the response carries a session', async () => {
  const { auth, lowdefy, assign } = setup({ signUpResult: { token: 'session-token', user: {} } });
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/verified' },
  });
  expect(assign.mock.calls).toEqual([['/verified']]);
});

test('signUp passes through rest params to signUpEmail', async () => {
  const { auth, lowdefy } = setup();
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({ email: 'user@example.com', password: 'password123', rememberMe: true });
  expect(auth.signUpEmail.mock.calls[0][0]).toMatchObject({ rememberMe: true });
});

test('login no longer handles signUp - a signUp-only call is rejected', async () => {
  const { auth, lowdefy } = setup();
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(login({ signUp: true, name: 'User' })).rejects.toThrow(
    'Login requires a "providerId", "email" and "password", or "magicLink: true" param.'
  );
  expect(auth.signUpEmail).not.toHaveBeenCalled();
});
