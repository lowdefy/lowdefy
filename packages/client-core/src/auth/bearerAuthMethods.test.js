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
import { UserError } from '@lowdefy/errors';

import createAuthFetchOptions from './createAuthFetchOptions.js';
import createAuthMethods from './createAuthMethods.js';
import getAuthorizationHeaders from './getAuthorizationHeaders.js';

// v7's auth actions on a bearer host (a native shell), through a stand-in for
// the shell's Better Auth client. The stand-in applies the core's fetch options
// as Better Auth's fetch (@better-fetch/fetch 1.3) does: the auth token as an
// authorization header when there is one, onSuccess with the response on a 2xx,
// onError with the request and response otherwise, then { data, error }.

const SIGNED_TOKEN = 'session-token.signature';

function createBearerHost(token = null) {
  let held = token;
  return {
    authTransport: 'bearer',
    fetch: vi.fn(),
    onCallerChanged: vi.fn(),
    tokenStore: {
      get: vi.fn(() => held),
      set: vi.fn(async (value) => {
        held = value;
      }),
      clear: vi.fn(async () => {
        held = null;
      }),
    },
  };
}

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

// The app's server as the shell's Better Auth client sees it, path by path.
function createServer() {
  const routes = {
    '/api/auth/email-otp/send-verification-otp': () => jsonResponse({ success: true }),
    '/api/auth/sign-in/email-otp': () =>
      jsonResponse(
        { token: 'session-token', user: { id: 'user-1' } },
        { headers: { 'set-auth-token': SIGNED_TOKEN } }
      ),
    '/api/auth/organization/set-active': () => jsonResponse({ id: 'org-2', name: 'Org Two' }),
    '/api/auth/sign-out': () => jsonResponse({ success: true }),
    '/api/auth/organization/accept-invitation': () =>
      jsonResponse({ invitation: { id: 'inv-1' }, member: { id: 'member-1' } }),
    '/api/auth/get-session': () =>
      jsonResponse({ session: { activeOrganizationId: 'org-2' }, user: { id: 'user-1' } }),
    '/api/auth/organization/list': () => jsonResponse([{ id: 'org-1' }, { id: 'org-2' }]),
    '/api/user': () =>
      jsonResponse({ user: { id: 'user-1', organization_id: 'org-2', roles: ['editor'] } }),
  };
  const calls = [];
  const fetch = vi.fn(async (url, init) => {
    const { pathname } = new URL(url);
    calls.push({ pathname, headers: new Headers(init.headers) });
    return routes[pathname]();
  });
  return { calls, fetch, routes };
}

function createBetterAuthStandIn({ fetch, fetchOptions }) {
  return async function callBetterAuth(path, { method = 'POST', params = {} } = {}) {
    const { fetchOptions: callOptions, ...body } = params;
    const headers = new Headers({ 'content-type': 'application/json', ...callOptions?.headers });
    const token = await fetchOptions.auth?.token();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    const request = { url: `https://app.example.com/api/auth${path}`, method, headers };
    const response = await fetch(request.url, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    if (response.ok) {
      await fetchOptions.onSuccess?.({ data, request, response });
      return { data, error: null };
    }
    const error = { ...data, status: response.status, statusText: response.statusText };
    await fetchOptions.onError?.({ error, request, response });
    return { data: null, error };
  };
}

function setup({ token = null } = {}) {
  const host = createBearerHost(token);
  const server = createServer();
  host.fetch = server.fetch;
  const callBetterAuth = createBetterAuthStandIn({
    fetch: server.fetch,
    fetchOptions: createAuthFetchOptions({ host }),
  });
  // The shell's auth adapter, as the web's AuthConfigured maps each method onto
  // its Better Auth client.
  const auth = {
    authConfig: { providers: [] },
    suppressSessionReload: vi.fn(),
    acceptInvitation: (params) => callBetterAuth('/organization/accept-invitation', { params }),
    emailOtpSend: (params) => callBetterAuth('/email-otp/send-verification-otp', { params }),
    emailOtpVerify: (params) => callBetterAuth('/sign-in/email-otp', { params }),
    getResolvedUser: async () => {
      const response = await host.fetch('https://app.example.com/api/user', {
        headers: getAuthorizationHeaders({ host }),
      });
      return response.json();
    },
    listOrganizations: () => callBetterAuth('/organization/list', { method: 'GET' }),
    refreshSession: () => callBetterAuth('/get-session', { method: 'GET' }),
    setActiveOrganization: (params) => callBetterAuth('/organization/set-active', { params }),
    signOut: () => callBetterAuth('/sign-out'),
    updateResolvedUser: vi.fn(),
  };
  const lowdefy = {
    _internal: {
      globals: {},
      host,
      router: { basePath: '', push: vi.fn(), replace: vi.fn() },
      storage: { clearUserStorage: vi.fn() },
    },
    home: { configured: false, pageId: 'home-page' },
    linkPaths: {},
    pagePaths: {},
    pathMemory: new Map(),
  };
  return { auth, host, lowdefy, methods: createAuthMethods(lowdefy, auth), server };
}

function authorizationOf(call) {
  return call.headers.get('authorization');
}

test('EmailOtpSend on a bearer host sends the sign-in code with no token held', async () => {
  const { methods, server, host } = setup();
  await expect(methods.emailOtpSend({ email: 'a@example.com' })).resolves.toEqual({
    success: true,
  });
  expect(server.calls.map((call) => call.pathname)).toEqual([
    '/api/auth/email-otp/send-verification-otp',
  ]);
  expect(authorizationOf(server.calls[0])).toBe(null);
  expect(host.tokenStore.set).not.toHaveBeenCalled();
});

test('EmailOtpSend on a bearer host keeps the captcha header beside the token', async () => {
  const { methods, server } = setup({ token: SIGNED_TOKEN });
  await methods.emailOtpSend({ email: 'a@example.com', captchaToken: 'captcha-1' });
  expect(server.calls[0].headers.get('x-captcha-response')).toBe('captcha-1');
  expect(authorizationOf(server.calls[0])).toBe(`Bearer ${SIGNED_TOKEN}`);
});

test('EmailOtpVerify on a bearer host keeps the token from set-auth-token', async () => {
  const { methods, host } = setup();
  const data = await methods.emailOtpVerify({
    callbackUrl: false,
    email: 'a@example.com',
    otp: '123456',
  });
  expect(data).toEqual({ token: 'session-token', user: { id: 'user-1' } });
  expect(host.tokenStore.set.mock.calls).toEqual([[SIGNED_TOKEN]]);
  expect(host.tokenStore.get()).toBe(SIGNED_TOKEN);
});

test('a bearer host sends the token it signed in with on the next auth call', async () => {
  const { methods, server } = setup();
  await methods.emailOtpVerify({ callbackUrl: false, email: 'a@example.com', otp: '123456' });
  await methods.listOrganizations();
  expect(authorizationOf(server.calls[0])).toBe(null);
  expect(authorizationOf(server.calls[1])).toBe(`Bearer ${SIGNED_TOKEN}`);
});

test('SetActiveOrganization on a bearer host sends the token', async () => {
  const { methods, server } = setup({ token: SIGNED_TOKEN });
  await expect(methods.setActiveOrganization({ organizationId: 'org-2' })).resolves.toEqual({
    id: 'org-2',
    name: 'Org Two',
  });
  expect(server.calls[0].pathname).toBe('/api/auth/organization/set-active');
  expect(authorizationOf(server.calls[0])).toBe(`Bearer ${SIGNED_TOKEN}`);
});

test('AcceptInvitation on a bearer host sends the token', async () => {
  const { methods, server } = setup({ token: SIGNED_TOKEN });
  await expect(methods.acceptInvitation({ invitationId: 'inv-1' })).resolves.toEqual({
    invitation: { id: 'inv-1' },
    member: { id: 'member-1' },
  });
  expect(server.calls[0].pathname).toBe('/api/auth/organization/accept-invitation');
  expect(authorizationOf(server.calls[0])).toBe(`Bearer ${SIGNED_TOKEN}`);
});

test('ListOrganizations on a bearer host sends the token', async () => {
  const { methods, server } = setup({ token: SIGNED_TOKEN });
  await expect(methods.listOrganizations()).resolves.toEqual([{ id: 'org-1' }, { id: 'org-2' }]);
  expect(server.calls[0].pathname).toBe('/api/auth/organization/list');
  expect(authorizationOf(server.calls[0])).toBe(`Bearer ${SIGNED_TOKEN}`);
});

test('UpdateSession on a bearer host refreshes the session and the resolved caller with the token', async () => {
  const { auth, lowdefy, methods, server } = setup({ token: SIGNED_TOKEN });
  await methods.updateSession();
  expect(server.calls.map((call) => [call.pathname, authorizationOf(call)])).toEqual([
    ['/api/auth/get-session', `Bearer ${SIGNED_TOKEN}`],
    ['/api/user', `Bearer ${SIGNED_TOKEN}`],
  ]);
  const user = { id: 'user-1', organization_id: 'org-2', roles: ['editor'] };
  expect(auth.updateResolvedUser.mock.calls).toEqual([[user]]);
  expect(lowdefy.user).toEqual(user);
});

test('Logout on a bearer host signs out with the token, then clears the token and user storage', async () => {
  const { host, lowdefy, methods, server } = setup({ token: SIGNED_TOKEN });
  await expect(methods.logout()).resolves.toEqual({ success: true });
  expect(server.calls[0].pathname).toBe('/api/auth/sign-out');
  expect(authorizationOf(server.calls[0])).toBe(`Bearer ${SIGNED_TOKEN}`);
  expect(host.tokenStore.clear).toHaveBeenCalledTimes(1);
  expect(host.tokenStore.get()).toBe(null);
  expect(lowdefy._internal.storage.clearUserStorage.mock.calls).toEqual([[{ keepUserId: null }]]);
});

test('Logout on a bearer host keeps the token when sign-out fails on the server', async () => {
  const { host, methods, server } = setup({ token: SIGNED_TOKEN });
  server.routes['/api/auth/sign-out'] = () =>
    jsonResponse({ message: 'Internal Server Error' }, { status: 500 });
  await expect(methods.logout()).rejects.toThrow('Internal Server Error');
  expect(host.tokenStore.clear).not.toHaveBeenCalled();
});

test('a 401 to an auth action that sent the token clears it and tells the host', async () => {
  const { host, methods, server } = setup({ token: SIGNED_TOKEN });
  server.routes['/api/auth/organization/set-active'] = () =>
    jsonResponse({ message: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  await expect(methods.setActiveOrganization({ organizationId: 'org-2' })).rejects.toThrow(
    UserError
  );
  expect(host.tokenStore.clear).toHaveBeenCalledTimes(1);
  expect(host.tokenStore.get()).toBe(null);
  expect(host.onCallerChanged).toHaveBeenCalledTimes(1);
});

test('a 401 to an auth action that sent no token leaves the host signed out as it was', async () => {
  const { host, methods, server } = setup();
  server.routes['/api/auth/sign-in/email-otp'] = () =>
    jsonResponse({ message: 'Unauthorized' }, { status: 401 });
  await expect(
    methods.emailOtpVerify({ callbackUrl: false, email: 'a@example.com', otp: '000000' })
  ).rejects.toThrow(UserError);
  expect(host.tokenStore.clear).not.toHaveBeenCalled();
  expect(host.onCallerChanged).not.toHaveBeenCalled();
});
