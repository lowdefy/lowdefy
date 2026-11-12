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

// The gate with BetterAuth's session read stood in for. The real read, and the
// cookie forms it accepts, are covered against the library in
// viewSessionAuthRoutes.mongodb.test.js.

import { vi, beforeEach, expect, test } from 'vitest';

const COOKIE = 'better-auth.session_token';

const sessions = {
  view_token: { session: { id: 'session_view', view: true }, user: { id: 'u1' } },
  browser_token: { session: { id: 'session_browser' }, user: { id: 'u1' } },
  phone_token: { session: { id: 'session_phone', mobile: true }, user: { id: 'u1' } },
};

// Stands in for BetterAuth's session endpoint: the session named by the
// session cookie of the headers it is called with.
const readSession = vi.fn(async ({ headers }) => {
  const pair = (headers.get('cookie') ?? '')
    .split('; ')
    .find((each) => each.startsWith(`${COOKIE}=`));
  const token = decodeURIComponent(pair?.slice(COOKIE.length + 1) ?? '').split('.')[0];
  return { headers: new Headers(), response: sessions[token] ?? null };
});

vi.doMock('better-auth/api', () => ({ getSession: () => readSession }));

const { default: buildViewSessionGatePlugin } = await import('./buildViewSessionGatePlugin.js');

const ctx = { authCookies: { sessionToken: { name: COOKIE } }, logger: { debug: vi.fn() } };
const signed = (token) => encodeURIComponent(`${token}.c2lnbmF0dXJl+/=`);

function run({ headers = {}, path = '/update-user' } = {}) {
  const request = new Request(`https://app.example.com/api/auth${path}`, {
    method: 'POST',
    headers,
  });
  return buildViewSessionGatePlugin().onRequest(request, ctx);
}

beforeEach(() => {
  readSession.mockClear();
});

test('buildViewSessionGatePlugin refuses a view session sent as a bearer with a 403 and a code', async () => {
  const answer = await run({ headers: { authorization: `Bearer ${signed('view_token')}` } });
  expect(answer.response.status).toBe(403);
  expect(await answer.response.json()).toEqual({
    code: 'VIEW_SESSION_REFUSED',
    message: 'A view session cannot be used on this route.',
  });
});

test('buildViewSessionGatePlugin reads the session from the database, without refreshing it', async () => {
  await run({ headers: { cookie: `${COOKIE}=${signed('browser_token')}` } });
  expect(readSession).toHaveBeenCalledWith(
    expect.objectContaining({
      context: ctx,
      query: { disableCookieCache: true, disableRefresh: true },
    })
  );
});

test('buildViewSessionGatePlugin refuses a view session sent as the session cookie', async () => {
  const answer = await run({
    headers: { cookie: `other=1; ${COOKIE}=${signed('view_token')}; theme=dark` },
  });
  expect(answer.response.status).toBe(403);
});

test('buildViewSessionGatePlugin refuses when either the bearer or the cookie is a view session', async () => {
  const cookieIsView = await run({
    headers: {
      authorization: `Bearer ${signed('browser_token')}`,
      cookie: `${COOKIE}=${signed('view_token')}`,
    },
  });
  expect(cookieIsView.response.status).toBe(403);
  const bearerIsView = await run({
    headers: {
      authorization: `bearer ${signed('view_token')}`,
      cookie: `${COOKIE}=${signed('browser_token')}`,
    },
  });
  expect(bearerIsView.response.status).toBe(403);
});

test('buildViewSessionGatePlugin refuses a view session on every path, served or not', async () => {
  for (const path of ['/get-session', '/sign-out', '/organization/set-active', '/no-such']) {
    const answer = await run({
      path,
      headers: { authorization: `Bearer ${signed('view_token')}` },
    });
    expect(answer.response.status).toBe(403);
  }
});

test('buildViewSessionGatePlugin passes a browser session and a phone session', async () => {
  expect(
    await run({ headers: { cookie: `${COOKIE}=${signed('browser_token')}` } })
  ).toBeUndefined();
  expect(
    await run({ headers: { authorization: `Bearer ${signed('phone_token')}` } })
  ).toBeUndefined();
});

test('buildViewSessionGatePlugin passes a request with no cookie and no bearer without reading a session', async () => {
  expect(await run()).toBeUndefined();
  expect(await run({ headers: { authorization: 'Basic Y2xpZW50OnNlY3JldA==' } })).toBeUndefined();
  expect(readSession).not.toHaveBeenCalled();
});

test('buildViewSessionGatePlugin passes a bearer that names no session', async () => {
  expect(
    await run({ headers: { authorization: 'Bearer eyJhbGciOiJFZERTQSJ9.e30.sig' } })
  ).toBeUndefined();
  expect(await run({ headers: { authorization: 'Bearer %E0%A4%A.sig' } })).toBeUndefined();
});
