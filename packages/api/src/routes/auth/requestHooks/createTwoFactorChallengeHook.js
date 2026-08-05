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

import beginTwoFactorChallenge from './beginTwoFactorChallenge.js';

// Builds an after-hook registration that intercepts a completed sign-in on a
// path BetterAuth's two-factor plugin does not cover
// (https://github.com/better-auth/better-auth/issues/10322). Everything except
// how the interception answers the caller is identical across those paths, so
// the entry guards and the challenge live here and `exit` supplies the per-path
// response: it either returns the hook's response body, or throws a redirect,
// which runAfterHooks turns into the response.
function createTwoFactorChallengeHook({ id, matches, exit }) {
  return {
    id,
    matches,
    handler: async (ctx) => {
      const newSession = ctx.context.newSession;
      // No session means no sign-in happened on this request, so there is
      // nothing to challenge. /callback/:id also serves account linking, which
      // attaches an account to an already signed-in user and redirects without
      // minting a session - a null newSession there is the ordinary linking
      // case, and acting on it would tear down a session that was never created.
      if (!newSession) {
        return undefined;
      }
      // Only enrolled users can answer a challenge. Without this guard every
      // sign-in on the hooked path lands on the challenge page, including users
      // holding no two-factor row: verify-totp throws TOTP_NOT_ENABLED and no
      // code they can type will ever work, so enabling two-factor would strand
      // the entire unenrolled population - worse than the gap being closed.
      if (!newSession.user?.twoFactorEnabled) {
        return undefined;
      }
      const outcome = await beginTwoFactorChallenge({ ctx, newSession });
      // The trust-device cookie stood in for the second factor; the session is
      // intact, so the endpoint's own response must stand.
      if (outcome === 'trusted') {
        return undefined;
      }
      return exit(ctx);
    },
  };
}

export default createTwoFactorChallengeHook;
