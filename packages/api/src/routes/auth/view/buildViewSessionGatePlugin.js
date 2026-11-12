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

const VIEW_SESSION_REFUSED = 'VIEW_SESSION_REFUSED';

// The session token is the part before the signature in the signed value a
// cookie or a bearer carries. A value that is not a signed token reads as
// itself, and names no session.
function readToken(value) {
  if (!type.isString(value) || value === '') {
    return null;
  }
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch (error) {
    // Not URI-encoded - read as sent.
  }
  return decoded.split('.')[0];
}

function readBearerToken({ headers }) {
  const authorization = headers.get('authorization') ?? '';
  if (authorization.slice(0, 7).toLowerCase() !== 'bearer ') {
    return null;
  }
  return readToken(authorization.slice(7).trim());
}

function readCookieToken({ cookieName, headers }) {
  const pair = (headers.get('cookie') ?? '')
    .split(';')
    .map((each) => each.trim())
    .find((each) => each.startsWith(`${cookieName}=`));
  if (type.isUndefined(pair)) {
    return null;
  }
  return readToken(pair.slice(cookieName.length + 1));
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
// The token is read from both places a session can arrive in - the bearer and
// the session cookie, since whoever holds the signed token can send it as
// either - and the request is refused when either names a view session. The
// signature is not checked: a forged token that names a view session is
// refused all the same, and the session row is the authority on the mark.
//
// Registered for every app, with or without a view now: a session minted
// before a deploy that removed the app's views must still be refused.
function buildViewSessionGatePlugin() {
  return {
    id: 'lowdefy-view-session-gate',
    async onRequest(request, ctx) {
      const tokens = [
        readBearerToken({ headers: request.headers }),
        readCookieToken({
          cookieName: ctx.authCookies.sessionToken.name,
          headers: request.headers,
        }),
      ].filter((token) => token !== null);
      for (const token of new Set(tokens)) {
        const session = await ctx.adapter.findOne({
          model: 'session',
          where: [{ field: 'token', value: token }],
        });
        if (session?.view === true) {
          ctx.logger.debug(
            `View session "${session.id}" refused on ${new URL(request.url).pathname}.`
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
