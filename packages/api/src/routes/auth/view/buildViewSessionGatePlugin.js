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

import { getSession } from 'better-auth/api';
import { setRequestCookie } from 'better-auth/cookies';

const VIEW_SESSION_REFUSED = 'VIEW_SESSION_REFUSED';

// The request's headers as the bearer plugin would hand them to an endpoint:
// the bearer set as the session cookie, by the function the plugin itself
// calls. null when the request carries no bearer.
function readBearerHeaders({ cookieName, headers }) {
  const authorization = headers.get('authorization') ?? '';
  if (authorization.slice(0, 7).toLowerCase() !== 'bearer ') {
    return null;
  }
  const token = authorization.slice(7).trim();
  if (token === '') {
    return null;
  }
  let decoded = token;
  try {
    decoded = decodeURIComponent(token);
  } catch (error) {
    // Not URI-encoded - read as sent.
  }
  const bearerHeaders = new Headers(headers);
  setRequestCookie(bearerHeaders, cookieName, decoded);
  return bearerHeaders;
}

// The session BetterAuth resolves from these headers, read by its own session
// endpoint, so the cookie is parsed, unquoted, decoded and verified exactly as
// every endpoint behind the gate would read it, and never refreshed.
//
// useCookieCache lets the read be answered from the session cookie cache when
// the app has it on, as the endpoint behind the gate would be. That is as
// strict as the database for the view mark: the cache is signed with the auth
// secret, BetterAuth uses it only when its token is the session cookie's, and
// it holds the session's additional fields, the view mark among them (only a
// field declared returned: false is left out, and the mark is not). A request
// with no cache cookie, or a stale one, is read from the database.
async function readSession({ ctx, headers, useCookieCache }) {
  const result = await getSession()({
    context: ctx,
    headers,
    method: 'GET',
    asResponse: false,
    returnHeaders: true,
    query: { disableCookieCache: !useCookieCache, disableRefresh: true },
  });
  return result?.response ?? null;
}

// A view session is refused on every /api/auth path: the session read, sign
// out, session listing and revoking, update user, change email, passkey
// registration, organization switching, OAuth consent and the rest. The view
// reads its user from the app's own routes, and a credential issued to an MCP
// client under a grant must not manage the person's account.
//
// It has to be said to BetterAuth itself. Its handler never passes through
// resolveAuthentication, so nothing there knows a view session from a browser
// session - and the bearer plugin, on for every app with a view, turns the
// view's bearer into a session cookie for all of its endpoints.
//
// onRequest is the place: it runs for every request the handler serves, before
// any endpoint, plugin middleware or request hook, and for nothing else. The
// in-process session read every other route resolves its caller with
// (auth.api.getSession) does not pass through it, so a view session still
// resolves there. A request hook (options.hooks.before) would run for that
// read too, and runs ahead of the bearer plugin's own hook.
//
// The gate asks BetterAuth which session the request carries rather than
// reading the cookie itself: a second parser that disagrees with BetterAuth's
// on one form of the header - a quoted value, a space before the equals sign -
// would pass a session the endpoint behind it accepts. Both places a session
// can arrive in are asked about, the session cookie and the bearer, since
// whoever holds the signed token can send it as either, and the request is
// refused when either is a view session.
//
// Registered for every app, with or without a view now: a session minted
// before a deploy that removed the app's views must still be refused.
function buildViewSessionGatePlugin() {
  return {
    id: 'lowdefy-view-session-gate',
    async onRequest(request, ctx) {
      // The cookie is what every signed-in browser sends on every /api/auth
      // request, so it is read the way the endpoint reads it, through the
      // cookie cache. The bearer is read from the database: a bearer never
      // comes with a cache cookie of its own, and one sent beside it belongs to
      // the cookie's session.
      const candidates = [];
      if (request.headers.has('cookie')) {
        candidates.push({ headers: request.headers, useCookieCache: true });
      }
      const bearerHeaders = readBearerHeaders({
        cookieName: ctx.authCookies.sessionToken.name,
        headers: request.headers,
      });
      if (bearerHeaders !== null) {
        candidates.push({ headers: bearerHeaders, useCookieCache: false });
      }
      for (const { headers, useCookieCache } of candidates) {
        const session = await readSession({ ctx, headers, useCookieCache });
        if (session?.session?.view === true) {
          ctx.logger.debug(
            `View session "${session.session.id}" refused on ${new URL(request.url).pathname}.`
          );
          return {
            response: Response.json(
              {
                code: VIEW_SESSION_REFUSED,
                message: 'A view session cannot be used on this route.',
              },
              { status: 403 }
            ),
          };
        }
      }
      return undefined;
    },
  };
}

export default buildViewSessionGatePlugin;
export { VIEW_SESSION_REFUSED };
