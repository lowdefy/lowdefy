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

import { isAPIError } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

// /magic-link/verify redirects to errorCallbackURL?error= for token and
// user-creation failures, but calls createSession without a catch, so a refusal
// thrown there - a ban, the active-organization wall, an app's
// session.create.before :reject - comes back as JSON. The browser navigated to
// this endpoint from the emailed link (or MagicLinkVerify), so nothing reads
// that JSON and the person sees it raw. This sends them to the error page
// instead, resolving the URL exactly as the endpoint does.
function createSignInRefusedRedirectHook() {
  return async function signInRefusedRedirectHook(ctx) {
    // Only a browser has anywhere to be redirected. BetterAuth clears the
    // caller's asResponse before after hooks run, so the request is what is
    // left to tell the two apart: the router always passes one, and a
    // server-side auth.api.magicLinkVerify() without one keeps its thrown
    // APIError.
    if (!(ctx.request instanceof Request)) {
      return undefined;
    }
    // A coded APIError, the rule BetterAuth applies where it does redirect
    // refusals (this endpoint's createUser catch, the OAuth callback). The
    // endpoint's own redirects - success and INVALID_TOKEN alike - are bodiless
    // 302 APIErrors, so they pass through untouched.
    const returned = ctx.context.returned;
    if (!isAPIError(returned) || !type.isString(returned.body?.code)) {
      return undefined;
    }
    // Truthiness, as the endpoint reads them: an empty errorCallbackURL= falls
    // back to callbackURL, and an empty callbackURL= to '/'.
    const callbackURL = ctx.query.callbackURL ? decodeURIComponent(ctx.query.callbackURL) : '/';
    const errorCallbackURL = ctx.query.errorCallbackURL
      ? decodeURIComponent(ctx.query.errorCallbackURL)
      : callbackURL;
    // The endpoint's origin checks are its own middleware, so their failures
    // reach this hook too, and when errorCallbackURL (or the callbackURL it
    // falls back to) is the URL that failed, the destination is untrusted. The
    // code cannot tell which URL failed: verify reports all three as
    // INVALID_CALLBACK_URL. Every other refusal fires after those checks
    // passed, so this changes nothing for them. BetterAuth skips the checks
    // only under disableOriginCheck, which getBetterAuthConfig never sets, or
    // in its test environment.
    if (!ctx.context.isTrustedOrigin(errorCallbackURL, { allowRelativePaths: true })) {
      return undefined;
    }
    const url = new URL(errorCallbackURL, ctx.context.baseURL);
    url.searchParams.set('error', returned.body.code);
    if (type.isString(returned.body.message)) {
      url.searchParams.set('error_description', returned.body.message);
    }
    // A Response, not `throw ctx.redirect(...)`: the dispatcher answers with the
    // endpoint's own status, so a thrown redirect would go out as a 403 with a
    // Location header the browser does not follow.
    return new Response(null, { status: 302, headers: { location: url.toString() } });
  };
}

export default createSignInRefusedRedirectHook;
