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

import { getAuthorizationHeaders } from '@lowdefy/client-core';

/**
 * The Fetch API a block calls the app's server with when it reads a response as a stream, such
 * as AgentChat's chat stream (server-sent events over a POST). React Native's own fetch buffers a
 * response body, so a native host gives `host.streamFetch`, a Fetch API whose body streams
 * (expo/fetch in the shell), sending what the host's fetch sends (the shell header, no cookies).
 * A call carries the caller's session as the core's requests do: a bearer host's session token
 * as Authorization.
 *
 * @param {Object} params
 * @param {Object} params.lowdefy The app-level lowdefy object, after createLowdefyCore.
 * @returns {(path: string, init?: Object) => Promise<Response>} Takes a path on the app's API,
 *   such as `/api/agent/chat/assistant`.
 */
function createStreamFetch({ lowdefy }) {
  return function streamFetch(path, init = {}) {
    const { host } = lowdefy._internal;
    return host.streamFetch(`${lowdefy.apiBase}${path}`, {
      ...init,
      headers: { ...init.headers, ...getAuthorizationHeaders({ host }) },
    });
  };
}

export default createStreamFetch;
