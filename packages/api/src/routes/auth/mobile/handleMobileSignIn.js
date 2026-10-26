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

import { timingSafeEqual } from 'node:crypto';

import { APIError } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

import createMobileAuthPageResponse from './createMobileAuthPageResponse.js';
import createMobileSignInCsrfToken from './createMobileSignInCsrfToken.js';
import createPhoneSession from './createPhoneSession.js';
import escapeHtml from './escapeHtml.js';
import getMobileSignInReturnUrl from './getMobileSignInReturnUrl.js';
import isSameOriginRequest from '../../../context/isSameOriginRequest.js';
import mintOneTimeToken from './mintOneTimeToken.js';
import readMobileSignInParams from './readMobileSignInParams.js';

// Set when a signed-out person is sent from /auth/mobile to sign in, to the
// time they were sent. A browser session created after it was created inside
// this sign-in, for the phone, and is ended once the phone has its own.
const STARTED_COOKIE = 'lowdefy_mobile_sign_in_started';
const STARTED_COOKIE_MAX_AGE = 15 * 60;

// A confirmation form posts a CSRF token and a decision; anything larger is
// not one.
const MAX_BODY_LENGTH = 4096;

const NO_STORE_HEADERS = {
  'cache-control': 'no-store',
  // The redirect target carries the one-time token; no Referer may echo it.
  'referrer-policy': 'no-referrer',
};

function textResponse({ message, status }) {
  return new Response(message, {
    status,
    headers: { ...NO_STORE_HEADERS, 'content-type': 'text/plain; charset=utf-8' },
  });
}

function redirect({ location, status = 302, cookie }) {
  const headers = new Headers({ ...NO_STORE_HEADERS, location });
  if (!type.isNone(cookie)) {
    headers.append('set-cookie', cookie);
  }
  return new Response(null, { status, headers });
}

function startedCookie({ url, value, maxAge }) {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${STARTED_COOKIE}=${value}; Path=${url.pathname}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

function readStartedAt({ request }) {
  const pair = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${STARTED_COOKIE}=`));
  if (type.isNone(pair)) {
    return null;
  }
  const startedAt = Number(pair.slice(STARTED_COOKIE.length + 1));
  return Number.isFinite(startedAt) ? startedAt : null;
}

function tokensMatch(expected, received) {
  if (!type.isString(received)) {
    return false;
  }
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function renderConfirmation({ appName, csrfToken, params, primaryColor, session, url }) {
  const app = escapeHtml(appName);
  const account = session.user.email ?? session.user.name;
  const asAccount = type.isNone(account) ? '' : ` as ${escapeHtml(account)}`;
  return createMobileAuthPageResponse({
    title: `Sign in to ${app}`,
    primaryColor,
    // Its url carries no secret (the shell, state and code challenge), and
    // the Continue post must carry the page's real Origin.
    referrerPolicy: 'same-origin',
    content: `<h1>Sign in to ${app} on this device?</h1>
<p>The ${escapeHtml(
      params.shell.id
    )} app is asking to sign in${asAccount}. Continue only if you opened this from that app.</p>
<form method="post" action="${escapeHtml(`${url.pathname}${url.search}`)}">
<input type="hidden" name="csrf_token" value="${escapeHtml(csrfToken)}" />
<button class="primary" type="submit" name="decision" value="continue">Continue</button>
<button class="secondary" type="submit" name="decision" value="cancel">Cancel</button>
</form>`,
  });
}

// POST /auth/mobile - the confirmation page's Continue or Cancel. Only a
// same-origin post from that page, shown to this browser session for this
// sign-in, is accepted: the Origin (and Sec-Fetch-Site) must be the app's own
// (the request's host, or the pinned canonical origin behind a proxy that
// rewrites Host), and the CSRF token must be the page's. The session cookie is SameSite, so a
// cross-site post carries none.
//
// Continue creates a new session for the phone (createPhoneSession), mints the
// one-time token for it, bound to the shell's code challenge, and returns it
// to the shell. A browser session created inside this sign-in is then ended;
// the person's existing browser session is left as it is. Cancel returns
// error=cancelled.
async function confirmMobileSignIn({ auth, authJson, params, request, session, url }) {
  const sameOrigin = isSameOriginRequest({
    getHeader: (name) => request.headers.get(name),
    publicOrigins: type.isString(auth.options?.baseURL) ? [auth.options.baseURL] : [],
  });
  if (!sameOrigin) {
    return textResponse({ message: 'Forbidden.', status: 403 });
  }
  const body = await request.text();
  if (body.length > MAX_BODY_LENGTH) {
    return textResponse({ message: 'Request too large.', status: 413 });
  }
  const form = new URLSearchParams(body);
  const { secret, adapter } = await auth.$context;
  const csrfToken = createMobileSignInCsrfToken({
    params,
    secret,
    sessionId: session.session.id,
  });
  if (!tokensMatch(csrfToken, form.get('csrf_token'))) {
    return textResponse({ message: 'Forbidden.', status: 403 });
  }
  const clearStarted = startedCookie({ url, value: '', maxAge: 0 });
  if (form.get('decision') !== 'continue') {
    const query = new URLSearchParams({ error: 'cancelled', state: params.state });
    return redirect({
      location: getMobileSignInReturnUrl({ auth, params, query, url }),
      status: 303,
      cookie: clearStarted,
    });
  }
  let phoneSession;
  try {
    phoneSession = await createPhoneSession({ auth, authJson, browserSession: session, request });
  } catch (error) {
    if (error instanceof APIError) {
      return textResponse({ message: error.message, status: 403 });
    }
    throw error;
  }
  const token = await mintOneTimeToken({
    auth,
    codeChallenge: params.codeChallenge,
    sessionToken: phoneSession.token,
  });
  const startedAt = readStartedAt({ request });
  if (!type.isNone(startedAt) && new Date(session.session.createdAt).getTime() >= startedAt) {
    await adapter.delete({ model: 'session', where: [{ field: 'id', value: session.session.id }] });
  }
  const query = new URLSearchParams({ token, state: params.state });
  return redirect({
    location: getMobileSignInReturnUrl({ auth, params, query, url }),
    status: 303,
    cookie: clearStarted,
  });
}

// /auth/mobile?shell=<id>&state=<s>&code_challenge=<c>&code_challenge_method=S256&platform=<p>
// - the page a phone shell opens in a system sign-in sheet for every sign-in
// method the app offers (passkeys, SSO, magic links, a second factor). The
// query is checked first (readMobileSignInParams); a bad one answers 400.
//
// - GET, signed out: redirect to the app's sign-in page, whose callbackUrl
//   brings the person back here once they are, and note when they were sent.
// - GET, signed in: a confirmation page, "Sign in to <app> on this device?",
//   naming the shell and the account, with Continue and Cancel. A GET never
//   mints a token, so an app that opens this page itself can not take a
//   session silently: the person sees which app is asking and can cancel.
// - POST: the confirmation (confirmMobileSignIn).
//
// The session is read from the database, not the cookie cache, so a session
// ended a moment ago is never used.
async function handleMobileSignIn({ auth, authJson, basePath, primaryColor, request }) {
  if (type.isNone(auth)) {
    return textResponse({ message: 'Auth is not configured.', status: 404 });
  }
  const url = new URL(request.url);
  const { error, params } = readMobileSignInParams({
    authJson,
    url,
    userAgent: request.headers.get('user-agent') ?? '',
  });
  if (!type.isNone(error)) {
    return textResponse({ message: error, status: 400 });
  }
  const { headers } = request;
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
  if (request.method === 'POST') {
    if (type.isNone(session)) {
      return textResponse({ message: 'Sign in again from the app.', status: 403 });
    }
    return confirmMobileSignIn({ auth, authJson, params, request, session, url });
  }
  if (type.isNone(session)) {
    const callbackUrl = `${url.pathname}${url.search}`;
    return redirect({
      location: `${basePath}${authJson.authPages.signIn}?callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`,
      cookie: startedCookie({ url, value: Date.now(), maxAge: STARTED_COOKIE_MAX_AGE }),
    });
  }
  const { secret } = await auth.$context;
  return renderConfirmation({
    appName: auth.options?.appName ?? 'this app',
    csrfToken: createMobileSignInCsrfToken({ params, secret, sessionId: session.session.id }),
    params,
    primaryColor,
    session,
    url,
  });
}

export default handleMobileSignIn;
