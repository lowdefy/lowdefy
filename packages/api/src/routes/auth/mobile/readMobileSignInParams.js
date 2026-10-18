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

// A state longer than this is not a shell's: shells send a short random value.
const STATE_MAX_LENGTH = 512;

// An S256 code challenge (RFC 7636): base64url(SHA-256(verifier)), unpadded.
const CODE_CHALLENGE = /^[A-Za-z0-9_-]{43}$/;

const PLATFORMS = new Set(['android', 'ios']);

// The query a phone shell opens /auth/mobile with:
// ?shell=<id>&state=<s>&code_challenge=<c>&code_challenge_method=S256&platform=ios|android
//
// - The shell must be one listed in mobile.shells, so the token only ever goes
//   to that shell's scheme or app link.
// - The shell must send a PKCE S256 code challenge. The challenge is stored
//   with the one-time token, and the exchange needs its verifier
//   (createCodeVerifierCheck).
// - platform picks the return: iOS's ASWebAuthenticationSession hands the
//   shell's scheme only to the app that opened it, while on Android any app can
//   register a scheme, so an Android shell gets the token by its verified app
//   link and must have one (an android package and sha256 in mobile.shells).
//
// Returns { params } or { error } (the 400 message).
function readMobileSignInParams({ authJson, url }) {
  const { searchParams } = url;
  const shellId = searchParams.get('shell');
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const platform = searchParams.get('platform');
  const shell = (authJson.mobile?.shells ?? []).find((each) => each.id === shellId);
  if (type.isNone(shell)) {
    return { error: 'Unknown shell.' };
  }
  if (!type.isString(state) || state.length === 0 || state.length > STATE_MAX_LENGTH) {
    return { error: 'The shell must send a state.' };
  }
  if (codeChallengeMethod !== 'S256' || !CODE_CHALLENGE.test(codeChallenge ?? '')) {
    return { error: 'The shell must send an S256 code_challenge (PKCE).' };
  }
  if (!PLATFORMS.has(platform)) {
    return { error: 'The shell must send its platform, ios or android.' };
  }
  if (platform === 'android' && shell.androidAppLink !== true) {
    return {
      error: `Shell "${shell.id}" has no Android app link. Set its android package and sha256 in mobile.shells.`,
    };
  }
  return { params: { codeChallenge, platform, shell, state } };
}

export default readMobileSignInParams;
