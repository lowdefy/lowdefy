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

import { type } from '@lowdefy/helpers';

/**
 * The app server's Better Auth routes the shell signs in and out with. Calls carry no cookie
 * (withoutCookies) and no Origin, so the server answers a sign-in with the session token in the
 * bearer plugin's set-auth-token header, which goes to the token store.
 *
 * Results are what the screens act on:
 * - sendCode: `sent` (also for an address the app does not admit: the server never says),
 *   `unavailable` (the app has no email code sign-in: open the sheet), `rateLimited`.
 * - signInWithCode: `signedIn`, `twoFactor` (finish in the sheet), `invalid` (a wrong or expired
 *   code), `rateLimited`.
 * - exchangeToken: `signedIn`, or `failed` when the server refuses the one-time token.
 * Any other answer throws.
 *
 * @param {Object} params
 * @param {string} params.apiBase The app server's URL.
 * @param {Function} params.fetch The shell's fetch, without the session watch.
 * @param {() => Promise<string>} params.getDeviceKey This phone's device key (createDeviceKey),
 *   sent on the email-code calls so the server can tell this phone from a stranger.
 * @param {{ set }} params.tokenStore The session token store.
 */
function createAuthApi({ apiBase, fetch, getDeviceKey, tokenStore }) {
  function post({ body, headers = {}, path }) {
    return fetch(`${apiBase}/api/auth${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  }

  async function keepSessionToken(res) {
    const token = res.headers.get('set-auth-token');
    if (type.isNone(token)) {
      throw new Error("The app's server signed you in but sent no session token.");
    }
    await tokenStore.set(token);
  }

  function unexpected(res, what) {
    return new Error(`The app's server answered ${res.status} to the ${what}.`);
  }

  async function deviceKeyHeader() {
    return { 'x-lowdefy-device-key': await getDeviceKey() };
  }

  async function sendCode({ email }) {
    const res = await post({
      path: '/email-otp/send-verification-otp',
      body: { email, type: 'sign-in' },
      headers: await deviceKeyHeader(),
    });
    if (res.ok) return { status: 'sent' };
    if (res.status === 404) return { status: 'unavailable' };
    if (res.status === 429) return { status: 'rateLimited' };
    throw unexpected(res, 'sign-in code request');
  }

  async function signInWithCode({ email, otp }) {
    const res = await post({
      path: '/sign-in/email-otp',
      body: { email, otp },
      headers: await deviceKeyHeader(),
    });
    if (res.status === 429) return { status: 'rateLimited' };
    if (res.status >= 400 && res.status < 500) return { status: 'invalid' };
    if (!res.ok) throw unexpected(res, 'sign-in');
    const body = await res.json();
    if (body?.twoFactorRedirect === true) return { status: 'twoFactor' };
    await keepSessionToken(res);
    return { status: 'signedIn' };
  }

  async function exchangeToken({ token, codeVerifier }) {
    const res = await post({
      path: '/one-time-token/verify',
      body: { token, code_verifier: codeVerifier },
    });
    if (res.status >= 400 && res.status < 500) return { status: 'failed' };
    if (!res.ok) throw unexpected(res, 'sign-in');
    await keepSessionToken(res);
    return { status: 'signedIn' };
  }

  // Ends the session on the server: its row is deleted, so the token is dead everywhere.
  function signOut({ token }) {
    return post({ path: '/sign-out', body: {}, headers: { Authorization: `Bearer ${token}` } });
  }

  return { exchangeToken, sendCode, signInWithCode, signOut };
}

export default createAuthApi;
