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

import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { createPkceChallenge } from '@lowdefy/client-core';

import parseQuery from './parseQuery.js';

const VERIFIER_BYTES = 64;

function sha256(data) {
  return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

/**
 * Signs in through the app's own sign-in page in a system sheet: every method the web app offers
 * (passkeys, SSO, magic links, a second factor).
 *
 * - The sheet opens /auth/mobile with a random state and a PKCE S256 challenge. It is ephemeral
 *   (no cookies shared with the phone's browser).
 * - Once the person is signed in, the server redirects to <scheme>://auth?token=&state= with a
 *   one-time token bound to the challenge.
 * - The shell checks state is its own, then exchanges the token with the code verifier for the
 *   session token. The verifier lives in this call only: it is in no URL and never stored, so a
 *   token another app catches from the redirect is useless.
 *
 * Returns { status }: `signedIn`, `cancelled` (the person closed the sheet) or `failed`.
 *
 * @param {Object} params
 * @param {string} params.apiBase The app server's URL.
 * @param {Object} params.authApi createAuthApi.
 * @param {{ id, scheme }} params.shell The shell config.
 */
async function signInWithSheet({ apiBase, authApi, shell }) {
  const state = Crypto.randomUUID();
  const { codeVerifier, codeChallenge, codeChallengeMethod } = await createPkceChallenge({
    verifierBytes: Crypto.getRandomBytes(VERIFIER_BYTES),
    sha256,
  });
  const query = [
    ['shell', shell.id],
    ['state', state],
    ['code_challenge', codeChallenge],
    ['code_challenge_method', codeChallengeMethod],
  ]
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('&');
  const result = await WebBrowser.openAuthSessionAsync(
    `${apiBase}/auth/mobile?${query}`,
    `${shell.scheme}://auth`,
    { preferEphemeralSession: true }
  );
  if (result.type !== 'success') {
    return { status: 'cancelled' };
  }
  const params = parseQuery(result.url);
  if (params.state !== state || !params.token) {
    return { status: 'failed' };
  }
  return authApi.exchangeToken({ token: params.token, codeVerifier });
}

export default signInWithSheet;
