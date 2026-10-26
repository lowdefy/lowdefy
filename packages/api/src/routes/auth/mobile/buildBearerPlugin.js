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

import { bearer } from 'better-auth/plugins';

import isNativeAuthRequest from './isNativeAuthRequest.js';

// BetterAuth's bearer plugin, for phone shells: a request carrying
// "Authorization: Bearer <signed session token>" is resolved as that session,
// as a cookie would be. requireSignature refuses an unsigned token, so only
// the signed value BetterAuth itself issued works; a JWT or another bearer
// fails the signature check and falls through to the API strategies untouched.
//
// The plugin also copies the session token into a set-auth-token response
// header whenever a response sets the session cookie. A browser's script can
// read response headers, and Lowdefy keeps the token out of reach of page
// script (sanitizeSessionResponse), so the header is sent only to native
// requests: a phone signing in, or exchanging a one-time token.
function buildBearerPlugin() {
  const plugin = bearer({ requireSignature: true });
  return {
    ...plugin,
    hooks: {
      ...plugin.hooks,
      after: plugin.hooks.after.map((hook) => ({
        ...hook,
        matcher: (ctx) => isNativeAuthRequest({ request: ctx.request }) && hook.matcher(ctx),
      })),
    },
  };
}

export default buildBearerPlugin;
