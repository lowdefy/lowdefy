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

import { APIError } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

import getOneTimeTokenIdentifiers from './getOneTimeTokenIdentifiers.js';
import matchesCodeChallenge from './matchesCodeChallenge.js';

// The hooks.before on /one-time-token/verify that binds the exchange to the
// shell that started the sign-in (PKCE, RFC 7636). The one-time token reaches
// the shell by a redirect to its custom scheme, which on Android any app can
// register and catch, so the token alone is not enough: the exchange must also
// send the code_verifier whose S256 challenge /auth/mobile stored beside the
// token (storeCodeChallenge). The verifier never leaves the shell's memory.
//
// The challenge is consumed on every attempt, and a refused attempt burns the
// token, so a caught token gets one guess and the shell's own exchange then
// fails closed instead of racing it. A token with no stored challenge is
// refused the same way. Every refusal answers as an unknown token does.
//
// A bare handler: buildOneTimeTokenPlugin owns the createAuthMiddleware
// wrapper.
function createCodeVerifierCheck() {
  return async function codeVerifierCheck(ctx) {
    const token = ctx.body?.token;
    // No token is the route's own validation error.
    if (!type.isString(token)) {
      return undefined;
    }
    const { internalAdapter } = ctx.context;
    const identifiers = getOneTimeTokenIdentifiers({ token });
    const challenge = await internalAdapter.consumeVerificationValue(identifiers.challenge);
    if (
      matchesCodeChallenge({
        codeChallenge: challenge?.value,
        codeVerifier: ctx.body.code_verifier,
      })
    ) {
      return undefined;
    }
    await internalAdapter.consumeVerificationValue(identifiers.token);
    throw new APIError('BAD_REQUEST', { message: 'Invalid token' });
  };
}

export default createCodeVerifierCheck;
