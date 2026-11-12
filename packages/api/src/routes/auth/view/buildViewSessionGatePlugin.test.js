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

import buildViewSessionGatePlugin from './buildViewSessionGatePlugin.js';

const COOKIE = 'better-auth.session_token';

// sessions: token → session row.
function createCtx({ sessions = {} } = {}) {
  return {
    adapter: {
      findOne: vi.fn(async ({ where }) => sessions[where[0].value] ?? null),
    },
    authCookies: { sessionToken: { name: COOKIE } },
    logger: { debug: vi.fn() },
  };
}

function createRequest({ headers = {}, path = '/update-user' } = {}) {
  return new Request(`https://app.example.com/api/auth${path}`, { method: 'POST', headers });
}

const sessions = {
  view_token: { id: 'session_view', view: true },
  browser_token: { id: 'session_browser' },
  phone_token: { id: 'session_phone', mobile: true },
};

const signed = (token) => encodeURIComponent(`${token}.c2lnbmF0dXJl+/=`);

async function run({ ctx = createCtx({ sessions }), ...request }) {
  const answer = await buildViewSessionGatePlugin().onRequest(createRequest(request), ctx);
  return { answer, ctx };
}

test('buildViewSessionGatePlugin refuses a view session sent as a bearer with a 403 and a code', async () => {
  const { answer, ctx } = await run({
    headers: { authorization: `Bearer ${signed('view_token')}` },
  });
  expect(answer.response.status).toBe(403);
  expect(await answer.response.json()).toEqual({
    code: 'VIEW_SESSION_REFUSED',
    message: 'A view session cannot be used on this route.',
  });
  expect(ctx.adapter.findOne).toHaveBeenCalledWith({
    model: 'session',
    where: [{ field: 'token', value: 'view_token' }],
  });
});

test('buildViewSessionGatePlugin refuses a view session sent as the session cookie', async () => {
  const { answer } = await run({
    headers: { cookie: `other=1; ${COOKIE}=${signed('view_token')}; theme=dark` },
  });
  expect(answer.response.status).toBe(403);
});

test('buildViewSessionGatePlugin refuses when either the bearer or the cookie names a view session', async () => {
  const cookieIsView = await run({
    headers: {
      authorization: `Bearer ${signed('browser_token')}`,
      cookie: `${COOKIE}=${signed('view_token')}`,
    },
  });
  expect(cookieIsView.answer.response.status).toBe(403);
  const bearerIsView = await run({
    headers: {
      authorization: `bearer ${signed('view_token')}`,
      cookie: `${COOKIE}=${signed('browser_token')}`,
    },
  });
  expect(bearerIsView.answer.response.status).toBe(403);
});

test('buildViewSessionGatePlugin refuses an unsigned token that names a view session', async () => {
  const { answer } = await run({ headers: { authorization: 'Bearer view_token' } });
  expect(answer.response.status).toBe(403);
});

test('buildViewSessionGatePlugin refuses a view session on every path, served or not', async () => {
  for (const path of ['/get-session', '/sign-out', '/organization/set-active', '/no-such']) {
    const { answer } = await run({
      path,
      headers: { authorization: `Bearer ${signed('view_token')}` },
    });
    expect(answer.response.status).toBe(403);
  }
});

test('buildViewSessionGatePlugin passes a browser session and a phone session', async () => {
  const browser = await run({ headers: { cookie: `${COOKIE}=${signed('browser_token')}` } });
  expect(browser.answer).toBeUndefined();
  const phone = await run({ headers: { authorization: `Bearer ${signed('phone_token')}` } });
  expect(phone.answer).toBeUndefined();
});

test('buildViewSessionGatePlugin passes a request with no session token without reading a session', async () => {
  const { answer, ctx } = await run({ headers: { cookie: 'theme=dark' } });
  expect(answer).toBeUndefined();
  expect(ctx.adapter.findOne).not.toHaveBeenCalled();
});

test('buildViewSessionGatePlugin passes a bearer and a basic credential that name no session', async () => {
  const jwt = await run({ headers: { authorization: 'Bearer eyJhbGciOiJFZERTQSJ9.e30.sig' } });
  expect(jwt.answer).toBeUndefined();
  const basic = await run({ headers: { authorization: 'Basic Y2xpZW50OnNlY3JldA==' } });
  expect(basic.answer).toBeUndefined();
  expect(basic.ctx.adapter.findOne).not.toHaveBeenCalled();
});

test('buildViewSessionGatePlugin reads a token that is not valid URI encoding as sent', async () => {
  const { answer, ctx } = await run({ headers: { authorization: 'Bearer %E0%A4%A.sig' } });
  expect(answer).toBeUndefined();
  expect(ctx.adapter.findOne).toHaveBeenCalledWith({
    model: 'session',
    where: [{ field: 'token', value: '%E0%A4%A' }],
  });
});

test('buildViewSessionGatePlugin reads one session when the bearer and the cookie carry the same token', async () => {
  const { ctx } = await run({
    headers: {
      authorization: `Bearer ${signed('browser_token')}`,
      cookie: `${COOKIE}=${signed('browser_token')}`,
    },
  });
  expect(ctx.adapter.findOne).toHaveBeenCalledTimes(1);
});
