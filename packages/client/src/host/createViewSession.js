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

function bearer(token) {
  return `Bearer ${token}`;
}

function sentToken(init) {
  const authorization = init?.headers?.Authorization;
  if (!type.isString(authorization) || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice('Bearer '.length);
}

// The view's session with its app: a bearer token minted through the host
// bridge and kept in tokenStore, and the two ways calls are sent with it.
//
// A view session lasts minutes and is never extended, so a 401 to a call that
// carried the token is expected: a new session is minted and the call is sent
// once more. The new session is for the same person, so nothing above the
// fetch hears of it and the page keeps its state. A second 401 in a row, or a
// session that cannot be minted, ends the view (onEnded): the response is
// handed back as it came.
//
// Calls that fail together share one mint, and a call refused for a token that
// has already been replaced is sent again with the current one.
function createViewSession({ apiBase, bridge, fetch, onEnded, tokenStore }) {
  let minting = null;

  function mint() {
    if (minting === null) {
      minting = bridge
        .mintSession()
        .then(({ token }) => {
          tokenStore.set(token);
          return token;
        })
        .finally(() => {
          minting = null;
        });
    }
    return minting;
  }

  async function replaceToken(refused) {
    const held = tokenStore.get();
    if (!type.isNone(held) && held !== refused) {
      return held;
    }
    return mint();
  }

  // fetch for a call that already carries the token as Authorization, as the
  // core's requests do. A call to anywhere but the app's API, or with no
  // token, is sent as it is.
  async function sessionFetch(input, init) {
    const refused = sentToken(init);
    const response = await fetch(input, init);
    if (
      response.status !== 401 ||
      refused === null ||
      !type.isString(input) ||
      !input.startsWith(`${apiBase}/`)
    ) {
      return response;
    }
    let token;
    try {
      token = await replaceToken(refused);
    } catch (error) {
      onEnded({ message: 'The view could not sign in to the app again.' });
      return response;
    }
    const retried = await fetch(input, {
      ...init,
      headers: { ...init.headers, Authorization: bearer(token) },
    });
    if (retried.status === 401) {
      onEnded({ message: 'The app refused the session of the view.' });
    }
    return retried;
  }

  // fetch for an API path ('/api/user'), signed in. Mints the first session.
  async function fetchApi(path, init = {}) {
    let token = tokenStore.get();
    if (type.isNone(token)) {
      try {
        token = await mint();
      } catch (error) {
        onEnded({ message: 'The view could not sign in to the app.' });
        throw error;
      }
    }
    return sessionFetch(`${apiBase}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: bearer(token) },
    });
  }

  return { fetch: sessionFetch, fetchApi };
}

export default createViewSession;
