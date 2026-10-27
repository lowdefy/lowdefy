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

import { parseCallerStamp } from '@lowdefy/helpers';

function sentToken(headers) {
  return Object.keys(headers ?? {}).some((name) => name.toLowerCase() === 'authorization');
}

/**
 * The fetch the app's session and core call the server with, watching what the server says of
 * the session token a call carried:
 * - a 401, or an answer as the signed-out caller (an empty x-lowdefy-caller stamp): the session is
 *   gone (signed out elsewhere, ended by an admin, expired), so onSessionEnded;
 * - a 403: this organisation refused the person (removed, or no longer allowed), so onRefused.
 * A call that carried no token says nothing about a session.
 */
function watchSession({ fetch, onRefused, onSessionEnded }) {
  return async function watchedFetch(url, init = {}) {
    const res = await fetch(url, init);
    if (!sentToken(init.headers)) {
      return res;
    }
    const stamp = parseCallerStamp(res.headers.get('x-lowdefy-caller'));
    if (res.status === 401 || stamp?.caller === '') {
      onSessionEnded();
    } else if (res.status === 403) {
      onRefused();
    }
    return res;
  };
}

export default watchSession;
