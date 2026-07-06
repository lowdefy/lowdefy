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
    impersonateUser: jest.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
    signInEmail: jest.fn(() => Promise.resolve({ data: { token: 't' }, error: null })),
    signUpEmail: jest.fn(() =>
      Promise.resolve({ data: signUpResult ?? { token: null, user: {} }, error: null })
    ),
    stopImpersonating: jest.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
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

test('logout prefixes basePath onto a relative callbackUrl and suppresses the sign-out reload', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.basePath = '/base';
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  auth.suppressSignOutReload = jest.fn();
  const { logout } = createAuthMethods(lowdefy, auth);
  await logout({ callbackUrl: { pageId: 'goodbye' } });
  expect(auth.suppressSignOutReload).toHaveBeenCalledTimes(1);
  expect(assign.mock.calls).toEqual([['/base/goodbye']]);
});

test('logout navigates to an absolute callbackUrl without prefixing basePath', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.basePath = '/base';
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  const { logout } = createAuthMethods(lowdefy, auth);
  await logout({ callbackUrl: { url: 'https://example.com/logged-out' } });
  expect(assign.mock.calls).toEqual([['https://example.com/logged-out']]);
});

test('logout without a callbackUrl signs out without navigating or suppressing the reload', async () => {
  const { auth, lowdefy, assign } = setup();
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  auth.suppressSignOutReload = jest.fn();
  const { logout } = createAuthMethods(lowdefy, auth);
  await logout();
  expect(auth.suppressSignOutReload).not.toHaveBeenCalled();
  expect(assign).not.toHaveBeenCalled();
});

test('login no longer handles signUp - a signUp-only call is rejected', async () => {
  const { auth, lowdefy } = setup();
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(login({ signUp: true, name: 'User' })).rejects.toThrow(
    'Login requires a "providerId", "email" and "password", or "magicLink: true" param.'
  );
  expect(auth.signUpEmail).not.toHaveBeenCalled();
});

test('impersonateUser calls auth.impersonateUser with the userId param', async () => {
  const { auth, lowdefy } = setup();
  const { impersonateUser } = createAuthMethods(lowdefy, auth);
  await impersonateUser({ userId: 'user-1' });
  expect(auth.impersonateUser.mock.calls).toEqual([[{ userId: 'user-1' }]]);
});

test('impersonateUser throws when userId is missing', async () => {
  const { auth, lowdefy } = setup();
  const { impersonateUser } = createAuthMethods(lowdefy, auth);
  await expect(impersonateUser()).rejects.toThrow('ImpersonateUser requires a "userId" param.');
  expect(auth.impersonateUser).not.toHaveBeenCalled();
});

test('impersonateUser surfaces the error returned by the endpoint', async () => {
  const { auth, lowdefy } = setup();
  auth.impersonateUser = jest.fn(() =>
    Promise.resolve({ data: null, error: { message: 'Forbidden.', code: 'FORBIDDEN', status: 403 } })
  );
  const { impersonateUser } = createAuthMethods(lowdefy, auth);
  await expect(impersonateUser({ userId: 'user-1' })).rejects.toThrow('Forbidden.');
});

test('stopImpersonating calls auth.stopImpersonating with no params', async () => {
  const { auth, lowdefy } = setup();
  const { stopImpersonating } = createAuthMethods(lowdefy, auth);
  await stopImpersonating();
  expect(auth.stopImpersonating.mock.calls).toEqual([[]]);
});

test('stopImpersonating surfaces the error returned by the endpoint', async () => {
  const { auth, lowdefy } = setup();
  auth.stopImpersonating = jest.fn(() =>
    Promise.resolve({ data: null, error: { message: 'No impersonation session.' } })
  );
  const { stopImpersonating } = createAuthMethods(lowdefy, auth);
  await expect(stopImpersonating()).rejects.toThrow('No impersonation session.');
});
