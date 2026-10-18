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

import { createAuthMiddleware } from 'better-auth/api';
import { oneTimeToken } from 'better-auth/plugins';

import createCodeVerifierCheck from './createCodeVerifierCheck.js';

// The one-time token the mobile sign-in page hands a shell, which the shell
// exchanges at /one-time-token/verify, with its PKCE code_verifier, for the
// session the person signed in to. It lasts one minute (expiresIn is in
// minutes) and is consumed by its first verify. Stored hashed, so the database
// never holds a usable token.
//
// Only the server mints one (handleMobileSignIn, through auth.api):
// disableClientRequest closes GET /one-time-token/generate to HTTP callers, so
// page script running in a signed-in browser can not turn its session into a
// token it could carry off. The verify route takes the token only with the
// verifier of the challenge it was minted for (createCodeVerifierCheck).
function buildOneTimeTokenPlugin() {
  const plugin = oneTimeToken({
    expiresIn: 1,
    disableClientRequest: true,
    storeToken: 'hashed',
  });
  return {
    ...plugin,
    hooks: {
      ...plugin.hooks,
      before: [
        ...(plugin.hooks.before ?? []),
        {
          matcher: (ctx) => ctx.path === '/one-time-token/verify',
          handler: createAuthMiddleware(createCodeVerifierCheck()),
        },
      ],
    },
  };
}

export default buildOneTimeTokenPlugin;
