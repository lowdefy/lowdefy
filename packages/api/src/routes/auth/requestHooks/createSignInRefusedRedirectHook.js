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

// The refusals session.create.before raises: the admin plugin's ban check, and
// the active-organization wall (createActiveOrgPolicyHook). Both run after the
// endpoint's origin checks have passed, so the error callback URL they redirect
// to has already been judged trusted. Any other error on this path - an origin
// check failure among them - keeps BetterAuth's own response, since its
// callback URL may be the untrusted one.
const SESSION_REFUSAL_CODES = ['BANNED_USER', 'MEMBERSHIP_REQUIRED'];

// /magic-link/verify redirects to errorCallbackURL?error= for token and
// user-creation failures, but calls createSession without a catch, so a refusal
// thrown there comes back as JSON. The browser navigated to this endpoint from
// the emailed link (or MagicLinkVerify), so nothing reads that JSON and the
// person sees it raw. This sends them to the error page instead, resolving the
// URL exactly as the endpoint does.
function createSignInRefusedRedirectHook() {
  return async function signInRefusedRedirectHook(ctx) {
    const returned = ctx.context.returned;
    if (!isAPIError(returned) || !SESSION_REFUSAL_CODES.includes(returned.body?.code)) {
      return undefined;
    }
    const callbackURL = type.isString(ctx.query?.callbackURL)
      ? decodeURIComponent(ctx.query.callbackURL)
      : '/';
    const errorCallbackURL = type.isString(ctx.query?.errorCallbackURL)
      ? decodeURIComponent(ctx.query.errorCallbackURL)
      : callbackURL;
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
