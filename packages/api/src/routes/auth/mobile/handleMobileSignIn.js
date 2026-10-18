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

import getMobileSessionExpiry from './getMobileSessionExpiry.js';
import storeCodeChallenge from './storeCodeChallenge.js';

// A state longer than this is not a shell's: shells send a short random value.
const STATE_MAX_LENGTH = 512;

// An S256 code challenge (RFC 7636): base64url(SHA-256(verifier)), unpadded.
const CODE_CHALLENGE = /^[A-Za-z0-9_-]{43}$/;

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

function redirect(location) {
  return new Response(null, { status: 302, headers: { ...NO_STORE_HEADERS, location } });
}

// GET /auth/mobile?shell=<id>&state=<s>&code_challenge=<c>&code_challenge_method=S256
// - the page a phone shell opens in a system sign-in sheet for every sign-in
// method the app offers (passkeys, SSO, magic links, a second factor).
//
// - The shell must be one listed in mobile.shells with a scheme, so the token
//   only ever goes to that scheme; any other shell id answers 400.
// - The shell must send a PKCE S256 code challenge, or the page answers 400.
//   The challenge is stored with the one-time token, and the exchange needs
//   its verifier (createCodeVerifierCheck): on Android any app can register
//   the shell's scheme and catch the redirect, and a caught token is useless
//   without the verifier, which never leaves the shell's memory.
// - Not signed in: redirect to the app's sign-in page, whose callbackUrl brings
//   the person back here once they are.
// - Signed in: mint a one-time token for the session on the server and
//   redirect to <scheme>://auth?token=...&state=..., where the shell exchanges
//   it, with its code_verifier, at /one-time-token/verify for the session
//   token. state comes back as the shell sent it, so the shell can tell its
//   own sign-in from another.
//
// The session is read from the database, not the cookie cache, so a session
// ended a moment ago is never handed on. When the app sets
// mobile.auth.sessionExpiresIn, the handed-on session is marked mobile and
// given the phone lifetime here, as one created by native sign-in is.
async function handleMobileSignIn({ auth, authJson, basePath, request }) {
  const url = new URL(request.url);
  const shellId = url.searchParams.get('shell');
  const state = url.searchParams.get('state');
  const codeChallenge = url.searchParams.get('code_challenge');
  const codeChallengeMethod = url.searchParams.get('code_challenge_method');
  if (type.isNone(auth)) {
    return textResponse({ message: 'Auth is not configured.', status: 404 });
  }
  const shell = (authJson.mobile?.shells ?? []).find((each) => each.id === shellId);
  if (type.isNone(shell)) {
    return textResponse({ message: 'Unknown shell.', status: 400 });
  }
  if (!type.isString(state) || state.length === 0 || state.length > STATE_MAX_LENGTH) {
    return textResponse({ message: 'The shell must send a state.', status: 400 });
  }
  if (codeChallengeMethod !== 'S256' || !CODE_CHALLENGE.test(codeChallenge ?? '')) {
    return textResponse({
      message: 'The shell must send an S256 code_challenge (PKCE).',
      status: 400,
    });
  }
  const { headers } = request;
  const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
  if (type.isNone(session)) {
    const callbackUrl = `${url.pathname}${url.search}`;
    return redirect(
      `${basePath}${authJson.authPages.signIn}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  }
  const { token } = await auth.api.generateOneTimeToken({ headers });
  await storeCodeChallenge({ auth, codeChallenge, token });
  const { sessionExpiresIn } = authJson.mobile;
  if (type.isNumber(sessionExpiresIn)) {
    const { adapter } = await auth.$context;
    await adapter.update({
      model: 'session',
      where: [{ field: 'id', value: session.session.id }],
      update: { mobile: true, expiresAt: getMobileSessionExpiry({ sessionExpiresIn }) },
    });
  }
  const query = new URLSearchParams({ token, state });
  return redirect(`${shell.scheme}://auth?${query.toString()}`);
}

export default handleMobileSignIn;
