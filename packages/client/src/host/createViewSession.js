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

// A session that has not reached its expiry is replaced on request (renew) at
// most this often. A websocket the server keeps closing for a caller change
// asks each time it reconnects, and every mint is a session written by the app
// and, past the grant's limit, one deleted from another open view.
const RENEW_LIMIT = 3;
const RENEW_WINDOW_MS = 15 * 60 * 1000;

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
//
// now is the clock, in milliseconds; a test gives its own.
function createViewSession({
  apiBase,
  bridge,
  fetch,
  now = () => Date.now(),
  onEnded,
  tokenStore,
}) {
  let minting = null;
  // When the held session ends, in milliseconds, or null when that is not known.
  let heldExpiresAt = null;
  // When each new session asked for with renew was minted.
  let renewals = [];

  // The app says when a session ends by its own clock. A time that has passed
  // by this clock as the session arrives means the two clocks disagree by more
  // than the session lasts, so it is not kept: read against this clock, every
  // session would look ended and be replaced at once.
  function readExpiresAt(expiresAt) {
    const time = type.isString(expiresAt) ? Date.parse(expiresAt) : NaN;
    if (Number.isNaN(time) || time <= now()) {
      return null;
    }
    return time;
  }

  function hasExpired() {
    return heldExpiresAt !== null && now() >= heldExpiresAt;
  }

  function mint() {
    if (minting === null) {
      minting = bridge
        .mintSession()
        .then(({ expiresAt, token }) => {
          tokenStore.set(token);
          heldExpiresAt = readExpiresAt(expiresAt);
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

  // The token for a call sessionFetch cannot send again, such as a websocket
  // handshake. No response tells such a call that its session has ended, so
  // the session is replaced here when none is held or the held one has reached
  // its expiry.
  //
  // renew asks for a new session though the held one has not expired: the
  // caller was told the session is gone, as a websocket is by a close for a
  // caller change. It is honoured RENEW_LIMIT times in RENEW_WINDOW_MS; past
  // that the held token is given, so a caller that keeps asking stops minting.
  // A session that cannot be minted rejects and does not end the view: the
  // next API call decides.
  async function getToken({ renew } = {}) {
    const held = tokenStore.get();
    if (type.isNone(held) || hasExpired()) {
      return mint();
    }
    if (renew !== true) {
      return held;
    }
    const time = now();
    renewals = renewals.filter((mintedAt) => time - mintedAt < RENEW_WINDOW_MS);
    if (renewals.length >= RENEW_LIMIT) {
      return held;
    }
    renewals.push(time);
    return mint();
  }

  return { fetch: sessionFetch, fetchApi, getToken };
}

export default createViewSession;
