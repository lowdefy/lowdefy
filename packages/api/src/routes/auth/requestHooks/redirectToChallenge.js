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

// Last-resort base for parsing only, reached only when neither BETTER_AUTH_URL
// nor the per-request base URL yields an origin. new URL needs an absolute base
// to resolve a path-relative twoFactorPageUrl. It is never emitted: the return
// strips back to pathname + search whenever baseUrlOrigin is absent.
const PARSE_ONLY_ORIGIN = 'http://lowdefy.invalid';

// The origin the pending destination is judged same-origin against.
// BETTER_AUTH_URL pins it when set; otherwise the endpoint has already derived
// one from the request and left it on ctx.context.baseURL - the very origin it
// resolved its own redirect against, so comparing against it is exact rather
// than approximate.
//
// This is load-bearing on the zero-config path rather than a tidy-up.
// /magic-link/verify resolves its destination to an absolute URL
// (`new URL(callbackURL, ctx.context.baseURL)`) and redirects there, so judging
// that against a placeholder origin would rule every same-origin deep link
// off-origin and silently drop it - the deployment keeps its challenge and
// loses every deep link, with nothing logged.
function resolveCompareOrigin({ baseUrlOrigin, ctx }) {
  if (type.isString(baseUrlOrigin)) {
    return baseUrlOrigin;
  }
  const requestBaseUrl = ctx.context.baseURL;
  if (type.isString(requestBaseUrl) && URL.canParse(requestBaseUrl)) {
    return new URL(requestBaseUrl).origin;
  }
  return PARSE_ONLY_ORIGIN;
}

// The redirect exit for an intercepted sign-in: sends the browser to the
// challenge page carrying the destination the user was actually headed for, so
// an enrolled user clicking an emailed link to /invoices/123 is not dumped on
// whatever the challenge page defaults to.
//
// The destination is read off the pending redirect rather than the request: the
// endpoint has already resolved wherever it was going to send them - magic link
// from ctx.query.callbackURL, an OAuth callback from the OAuth state - and left
// it on the response headers, so one rule covers every redirect path.
//
// Same-origin, path-only. The challenge page is public and its query is
// attacker-suppliable, so an off-origin destination is dropped rather than
// carried: handing control to another origin after a completed challenge is not
// a capability anyone asked for. Taking pathname + search off a parsed URL also
// rules out a protocol-relative "//evil.com", which a startsWith('/') check
// would wave through.
//
// No parameter is emitted when there is nothing to carry - /magic-link/verify
// answers with JSON instead of redirecting when no callbackURL was given, so
// there is no pending location - and the challenge page then falls back to its
// own default.
function redirectToChallenge({ baseUrlOrigin, ctx, twoFactorPageUrl }) {
  const compareOrigin = resolveCompareOrigin({ baseUrlOrigin, ctx });
  const url = new URL(twoFactorPageUrl, compareOrigin);
  const pending = ctx.context.responseHeaders?.get('location');
  if (type.isString(pending)) {
    const target = new URL(pending, compareOrigin);
    if (target.origin === url.origin) {
      url.searchParams.set('callbackUrl', `${target.pathname}${target.search}`);
    }
  }
  throw ctx.redirect(
    type.isString(baseUrlOrigin) ? url.toString() : `${url.pathname}${url.search}`
  );
}

export default redirectToChallenge;
