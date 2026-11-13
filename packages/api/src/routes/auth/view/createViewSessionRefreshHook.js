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

// session.update.before, always bound. BetterAuth slides a session forward by
// auth.session.expiresIn when it is read (getSession) - and a view session,
// minted with fifteen minutes left, is due that refresh on every read. The
// caller resolution reads a view's bearer with the refresh off
// (VIEW_SESSION_TOKEN_PREFIX); this holds the expiry on any other read, such as
// the token sent as a session cookie.
// getSession has put the session it is refreshing on the endpoint context
// first, so a refresh of a view session is told by its view mark and its
// expiry is held where minting set it. The update cannot be vetoed instead:
// getSession answers a refused refresh as a failed session.
//
// Bound whether or not the app has a view now: a session minted before a
// deploy that removed the app's views must not become an ordinary one.
function createViewSessionRefreshHook() {
  return async function viewSessionRefresh(changes, ctx) {
    if (changes.expiresAt === undefined) {
      return undefined;
    }
    const session = ctx?.context?.session?.session;
    if (session?.view !== true) {
      return undefined;
    }
    return {
      data: {
        ...changes,
        expiresAt: session.expiresAt,
      },
    };
  };
}

export default createViewSessionRefreshHook;
