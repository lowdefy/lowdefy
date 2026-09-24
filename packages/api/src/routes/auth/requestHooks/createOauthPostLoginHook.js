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

import { getSessionFromCtx } from 'better-auth/api';

import { OAUTH_POST_LOGIN_CONFIRMED } from '../buildOauthPostLogin.js';

// The engine-tier request hooks.before on /oauth2/continue. The oauth-provider
// resumes the authorization inside this very request and asks
// postLogin.shouldRedirect again, but it stamps "post-login done" (ba_pl) into
// the signed query only on its consent redirect - never on the post-login one
// - so without help the picker page would be shown again and the flow would
// loop. The choice was just posted (body.postLogin === true), so this marks
// the session object the request caches (getSessionFromCtx memoizes it on
// ctx.context.session; the endpoint's sessionMiddleware and authorize read
// that same object). Nothing is written to the database: the marker exists for
// this request only, which is exactly as long as it is true.
//
// A bare handler: the request-hook assembler matches /oauth2/continue and owns
// the createAuthMiddleware wrapper. Always falls through - the endpoint itself
// validates the signed query and the session.
function createOauthPostLoginHook() {
  return async function oauthPostLoginHook(ctx) {
    if (ctx.body?.postLogin !== true) {
      return undefined;
    }
    const session = await getSessionFromCtx(ctx);
    if (session?.session) {
      session.session[OAUTH_POST_LOGIN_CONFIRMED] = true;
    }
    return undefined;
  };
}

export default createOauthPostLoginHook;
