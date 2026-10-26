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

import createMobileSignInCsrfToken from './createMobileSignInCsrfToken.js';
import getOneTimeTokenIdentifiers from './getOneTimeTokenIdentifiers.js';
import handleMobileSignIn from './handleMobileSignIn.js';

const ORIGIN = 'https://field.example.com';
const SECRET = 'x'.repeat(32);

const authJson = {
  authPages: { signIn: '/login' },
  mobile: {
    shells: [
      { id: 'field', scheme: 'com.example.field', androidAppLink: true },
      { id: 'iosOnly', scheme: 'com.example.ios', androidAppLink: false },
    ],
    sessionExpiresIn: null,
  },
};

// RFC 7636 appendix B.
const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
const pkce = `code_challenge=${challenge}&code_challenge_method=S256`;
const query = `shell=field&state=a%26b&${pkce}&platform=ios`;

function browserSession({ createdAt = new Date(Date.now() - 60 * 60 * 1000) } = {}) {
  return {
    session: { id: 's1', userId: 'u1', activeOrganizationId: 'org-2', createdAt },
    user: { id: 'u1', email: 'ana@example.com' },
  };
}

function createAuth({ session = null, baseURL, appName = 'Field <App>' } = {}) {
  const adapter = { update: vi.fn(), delete: vi.fn() };
  const internalAdapter = {
    createSession: vi.fn(async () => ({
      id: 'phone-1',
      token: 'phone-token',
      activeOrganizationId: 'org-1',
    })),
    createVerificationValue: vi.fn(),
  };
  return {
    adapter,
    internalAdapter,
    auth: {
      api: { getSession: vi.fn(async () => session) },
      options: { appName, baseURL },
      $context: Promise.resolve({ adapter, internalAdapter, secret: SECRET }),
    },
  };
}

function getRequest(path, headers = {}) {
  return new Request(`${ORIGIN}${path}`, { headers: { cookie: 'a=b', ...headers } });
}

function csrfFor({ platform = 'ios', sessionId = 's1', state = 'a&b' } = {}) {
  return createMobileSignInCsrfToken({
    params: {
      codeChallenge: challenge,
      platform,
      shell: { id: 'field' },
      state,
    },
    secret: SECRET,
    sessionId,
  });
}

function postRequest({
  path = `/auth/mobile?${query}`,
  csrf = csrfFor(),
  decision = 'continue',
  headers = {},
} = {}) {
  const body = new URLSearchParams({ csrf_token: csrf, decision });
  return new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: {
      cookie: 'a=b',
      host: 'field.example.com',
      origin: ORIGIN,
      'content-type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body: body.toString(),
  });
}

function call({ auth, request, primaryColor = '#00aa55', json = authJson }) {
  return handleMobileSignIn({ auth, authJson: json, basePath: '', primaryColor, request });
}

test('handleMobileSignIn answers 404 when auth is not configured', async () => {
  const response = await call({ auth: null, request: getRequest(`/auth/mobile?${query}`) });
  expect(response.status).toBe(404);
});

test.each([
  [`/auth/mobile?state=s&${pkce}&platform=ios`],
  [`/auth/mobile?shell=other&state=s&${pkce}&platform=ios`],
  [`/auth/mobile?shell=field&${pkce}&platform=ios`],
  [`/auth/mobile?shell=field&state=${'s'.repeat(513)}&${pkce}&platform=ios`],
  ['/auth/mobile?shell=field&state=s&platform=ios'],
  [`/auth/mobile?shell=field&state=s&code_challenge=${challenge}&platform=ios`],
  [
    `/auth/mobile?shell=field&state=s&code_challenge=${challenge}&code_challenge_method=plain&platform=ios`,
  ],
  ['/auth/mobile?shell=field&state=s&code_challenge_method=S256&platform=ios'],
  [
    `/auth/mobile?shell=field&state=s&code_challenge=${challenge}A&code_challenge_method=S256&platform=ios`,
  ],
  [
    `/auth/mobile?shell=field&state=s&code_challenge=${challenge.slice(
      0,
      -1
    )}%3D&code_challenge_method=S256&platform=ios`,
  ],
  [`/auth/mobile?shell=field&state=s&${pkce}`],
  [`/auth/mobile?shell=field&state=s&${pkce}&platform=web`],
  [`/auth/mobile?shell=iosOnly&state=s&${pkce}&platform=android`],
])('handleMobileSignIn answers 400 to %s', async (path) => {
  const { auth } = createAuth();
  const response = await call({ auth, request: getRequest(path) });
  expect(response.status).toBe(400);
  expect(auth.api.getSession).not.toHaveBeenCalled();
});

test('handleMobileSignIn names the missing Android app link', async () => {
  const { auth } = createAuth();
  const response = await call({
    auth,
    request: getRequest(`/auth/mobile?shell=iosOnly&state=s&${pkce}&platform=android`),
  });
  expect(await response.text()).toBe(
    'Shell "iosOnly" has no Android app link. Set its android package and sha256 in mobile.shells.'
  );
});

test('handleMobileSignIn answers 400 for an app with no mobile section', async () => {
  const { auth } = createAuth();
  const response = await call({
    auth,
    json: { authPages: { signIn: '/login' } },
    request: getRequest(`/auth/mobile?${query}`),
  });
  expect(response.status).toBe(400);
});

test('handleMobileSignIn sends a signed-out person to the sign-in page under the basePath and notes when', async () => {
  const { auth } = createAuth();
  const before = Date.now();
  const response = await handleMobileSignIn({
    auth,
    authJson,
    basePath: '/app',
    request: getRequest(`/app/auth/mobile?${query}`),
  });
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe(
    `/app/login?callbackUrl=${encodeURIComponent(`/app/auth/mobile?${query}`)}`
  );
  expect(auth.api.getSession).toHaveBeenCalledWith({
    headers: expect.any(Headers),
    query: { disableCookieCache: true },
  });
  const cookie = response.headers.get('set-cookie');
  expect(cookie).toMatch(
    /^lowdefy_mobile_sign_in_started=\d+; Path=\/app\/auth\/mobile; Max-Age=900; HttpOnly; SameSite=Lax; Secure$/
  );
  expect(Number(cookie.split(';')[0].split('=')[1])).toBeGreaterThanOrEqual(before);
});

test('handleMobileSignIn shows a signed-in person a confirmation page and mints nothing on a GET', async () => {
  const { adapter, auth, internalAdapter } = createAuth({ session: browserSession() });
  const response = await call({ auth, request: getRequest(`/auth/mobile?${query}`) });
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('referrer-policy')).toBe('same-origin');
  expect(response.headers.get('x-frame-options')).toBe('DENY');
  const csp = response.headers.get('content-security-policy');
  const nonce = csp.match(/style-src 'nonce-([^']+)'/)[1];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("default-src 'none'");

  const html = await response.text();
  expect(html).toContain('<meta name="referrer" content="same-origin" />');
  expect(html).toContain('Sign in to Field &lt;App&gt; on this device?');
  expect(html).toContain('The field app is asking to sign in as ana@example.com.');
  expect(html).toContain(`<style nonce="${nonce}">`);
  expect(html).toContain('--primary: #00aa55;');
  expect(html).toContain(`action="/auth/mobile?${query.replaceAll('&', '&amp;')}"`);
  expect(html).toContain(`name="csrf_token" value="${csrfFor()}"`);
  expect(html).toContain('value="continue">Continue</button>');
  expect(html).toContain('value="cancel">Cancel</button>');

  expect(internalAdapter.createSession).not.toHaveBeenCalled();
  expect(internalAdapter.createVerificationValue).not.toHaveBeenCalled();
  expect(adapter.update).not.toHaveBeenCalled();
  expect(adapter.delete).not.toHaveBeenCalled();
});

test('handleMobileSignIn writes only a hex primary colour into the page', async () => {
  const { auth } = createAuth({ session: browserSession() });
  const response = await call({
    auth,
    primaryColor: 'red;}</style><script>alert(1)</script>',
    request: getRequest(`/auth/mobile?${query}`),
  });
  const html = await response.text();
  expect(html).toContain('--primary: #1677ff;');
  expect(html).not.toContain('alert(1)');
});

test('handleMobileSignIn on Continue creates a new phone session with the browser organization and returns its token to the iOS scheme', async () => {
  const { adapter, auth, internalAdapter } = createAuth({ session: browserSession() });
  const response = await call({ auth, request: postRequest() });

  expect(internalAdapter.createSession).toHaveBeenCalledWith('u1', false, { userAgent: '' }, true);
  expect(adapter.update).toHaveBeenCalledWith({
    model: 'session',
    where: [{ field: 'id', value: 'phone-1' }],
    update: { activeOrganizationId: 'org-2' },
  });
  expect(response.status).toBe(303);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  const location = new URL(response.headers.get('location'));
  expect(`${location.protocol}//${location.host}`).toBe('com.example.field://auth');
  expect(location.searchParams.get('state')).toBe('a&b');
  const token = location.searchParams.get('token');
  expect(internalAdapter.createVerificationValue).toHaveBeenCalledWith({
    identifier: getOneTimeTokenIdentifiers({ token }).token,
    value: 'phone-token',
    expiresAt: expect.any(Date),
  });
  expect(internalAdapter.createVerificationValue).toHaveBeenCalledWith({
    identifier: getOneTimeTokenIdentifiers({ token }).challenge,
    value: challenge,
    expiresAt: expect.any(Date),
  });
  // The browser's own session is neither handed over, marked nor ended.
  expect(adapter.update).toHaveBeenCalledTimes(1);
  expect(adapter.delete).not.toHaveBeenCalled();
  expect(response.headers.get('set-cookie')).toMatch(
    /^lowdefy_mobile_sign_in_started=; .*Max-Age=0/
  );
});

test('handleMobileSignIn gives the phone session the phone lifetime and mark when one is set', async () => {
  const { auth, internalAdapter } = createAuth({ session: browserSession() });
  await call({
    auth,
    json: { ...authJson, mobile: { ...authJson.mobile, sessionExpiresIn: 60 } },
    request: postRequest({ headers: { 'user-agent': 'Sheet' } }),
  });
  const [, , override] = internalAdapter.createSession.mock.calls[0];
  expect(override).toEqual({ userAgent: 'Sheet', mobile: true, expiresAt: expect.any(Date) });
  expect(override.expiresAt.getTime() - Date.now()).toBeGreaterThan(55 * 1000);
});

test('handleMobileSignIn returns an Android sign-in by the https app link on the canonical origin', async () => {
  const { auth } = createAuth({
    session: browserSession(),
    baseURL: 'https://canonical.example.com',
  });
  const androidQuery = query.replace('platform=ios', 'platform=android');
  const response = await call({
    auth,
    request: postRequest({
      path: `/app/auth/mobile?${androidQuery}`,
      csrf: csrfFor({ platform: 'android' }),
    }),
  });
  expect(response.status).toBe(303);
  const location = new URL(response.headers.get('location'));
  expect(`${location.origin}${location.pathname}`).toBe(
    'https://canonical.example.com/app/auth/mobile/callback'
  );
  expect(location.searchParams.get('state')).toBe('a&b');
  expect(location.searchParams.get('token')).toEqual(expect.any(String));
});

test('handleMobileSignIn on Cancel returns error=cancelled and mints nothing', async () => {
  const { auth, internalAdapter } = createAuth({ session: browserSession() });
  const response = await call({ auth, request: postRequest({ decision: 'cancel' }) });
  expect(response.status).toBe(303);
  expect(response.headers.get('location')).toBe(
    'com.example.field://auth?error=cancelled&state=a%26b'
  );
  expect(internalAdapter.createSession).not.toHaveBeenCalled();
  expect(internalAdapter.createVerificationValue).not.toHaveBeenCalled();
});

test.each([
  ['no Origin', { origin: '' }],
  ['a foreign Origin', { origin: 'https://evil.example.com' }],
  ['an opaque Origin, as a no-referrer page posts', { origin: 'null' }],
  ['a cross-site fetch', { 'sec-fetch-site': 'cross-site' }],
])('handleMobileSignIn refuses a confirmation post with %s', async (_, headers) => {
  const { auth, internalAdapter } = createAuth({ session: browserSession() });
  const request = postRequest({ headers });
  if (headers.origin === '') {
    request.headers.delete('origin');
  }
  const response = await call({ auth, request });
  expect(response.status).toBe(403);
  expect(internalAdapter.createSession).not.toHaveBeenCalled();
  expect(internalAdapter.createVerificationValue).not.toHaveBeenCalled();
});

test('handleMobileSignIn accepts the pinned canonical origin behind a proxy that rewrites Host', async () => {
  const { auth } = createAuth({
    session: browserSession(),
    baseURL: 'https://canonical.example.com',
  });
  const response = await call({
    auth,
    request: postRequest({
      headers: { host: 'internal:3000', origin: 'https://canonical.example.com' },
    }),
  });
  expect(response.status).toBe(303);
});

test.each([
  ['no CSRF token', ''],
  ['a CSRF token for another session', csrfFor({ sessionId: 's2' })],
  ['a CSRF token for another sign-in', csrfFor({ state: 'other' })],
  ['a CSRF token for another platform', csrfFor({ platform: 'android' })],
])('handleMobileSignIn refuses a confirmation post with %s', async (_, csrf) => {
  const { auth, internalAdapter } = createAuth({ session: browserSession() });
  const response = await call({ auth, request: postRequest({ csrf }) });
  expect(response.status).toBe(403);
  expect(internalAdapter.createSession).not.toHaveBeenCalled();
  expect(internalAdapter.createVerificationValue).not.toHaveBeenCalled();
});

test('handleMobileSignIn refuses a confirmation post with no session', async () => {
  const { auth, internalAdapter } = createAuth();
  const response = await call({ auth, request: postRequest() });
  expect(response.status).toBe(403);
  expect(internalAdapter.createVerificationValue).not.toHaveBeenCalled();
});

test('handleMobileSignIn refuses an oversized confirmation post', async () => {
  const { auth, internalAdapter } = createAuth({ session: browserSession() });
  const request = new Request(`${ORIGIN}/auth/mobile?${query}`, {
    method: 'POST',
    headers: { host: 'field.example.com', origin: ORIGIN },
    body: `csrf_token=${csrfFor()}&decision=continue&pad=${'x'.repeat(5000)}`,
  });
  const response = await call({ auth, request });
  expect(response.status).toBe(413);
  expect(internalAdapter.createSession).not.toHaveBeenCalled();
});

test('handleMobileSignIn ends a browser session created inside this sign-in once the phone has its own', async () => {
  const startedAt = Date.now() - 30 * 1000;
  const { adapter, auth } = createAuth({
    session: browserSession({ createdAt: new Date(startedAt + 1000) }),
  });
  const response = await call({
    auth,
    request: postRequest({
      headers: { cookie: `a=b; lowdefy_mobile_sign_in_started=${startedAt}` },
    }),
  });
  expect(response.status).toBe(303);
  expect(adapter.delete).toHaveBeenCalledWith({
    model: 'session',
    where: [{ field: 'id', value: 's1' }],
  });
});

test('handleMobileSignIn leaves a browser session made before this sign-in alone', async () => {
  const startedAt = Date.now() - 30 * 1000;
  const { adapter, auth } = createAuth({
    session: browserSession({ createdAt: new Date(startedAt - 1000) }),
  });
  await call({
    auth,
    request: postRequest({
      headers: { cookie: `a=b; lowdefy_mobile_sign_in_started=${startedAt}` },
    }),
  });
  expect(adapter.delete).not.toHaveBeenCalled();
});

test('handleMobileSignIn refuses the iOS return to an Android browser', async () => {
  const { auth } = createAuth();
  const response = await call({
    auth,
    request: getRequest(`/auth/mobile?${query}`, {
      'user-agent':
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36',
    }),
  });
  expect(response.status).toBe(400);
  expect(await response.text()).toBe('An Android browser must ask for the android return.');
  expect(auth.api.getSession).not.toHaveBeenCalled();
});
