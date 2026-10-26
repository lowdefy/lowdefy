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

const PAIR_HEADER = 'x-lowdefy-pair';

/**
 * How calls reach a dev server: `{ fetch, WebSocket, wrapFetch }`, sending the pairing token of
 * `lowdefy dev --lan` as x-lowdefy-pair on every request and websocket upgrade. wrapFetch adds it
 * to another Fetch API (the dev-tab client's streaming one). Without a token (a simulator, a USB
 * phone) they are the platform's own.
 *
 * @param {Object} params
 * @param {Function} params.fetch The Fetch API.
 * @param {Function} params.WebSocket The WebSocket class (React Native's takes headers).
 * @param {string|null} params.pair The pairing token.
 */
function createDevTransport({ fetch, pair, WebSocket }) {
  if (pair === null) {
    return { fetch, WebSocket, wrapFetch: (baseFetch) => baseFetch };
  }
  function wrapFetch(baseFetch) {
    return function pairedFetch(url, init = {}) {
      return baseFetch(url, { ...init, headers: { ...init.headers, [PAIR_HEADER]: pair } });
    };
  }
  class PairedWebSocket extends WebSocket {
    constructor(url, protocols, options = {}) {
      super(url, protocols, {
        ...options,
        headers: { ...options.headers, [PAIR_HEADER]: pair },
      });
    }
  }
  return { fetch: wrapFetch(fetch), WebSocket: PairedWebSocket, wrapFetch };
}

export { PAIR_HEADER };
export default createDevTransport;
