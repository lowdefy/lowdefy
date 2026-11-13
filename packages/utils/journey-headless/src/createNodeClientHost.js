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

import createMemoryStore from './createMemoryStore.js';

// The platform @lowdefy/client-core reaches (HOST_KEYS in createLowdefyCore.js), for a page with
// no browser. Requests and endpoint calls do not reach fetch: openHeadlessPage replaces callRequest
// and callAPI with the host's in-process calls, so a fetch here is a call the runner does not
// know, and fails. WebSockets need the browser. The build and caller checks never fire, since no
// response comes over HTTP.
function createNodeClientHost({ globals, router }) {
  return {
    fetch: (url) => {
      throw new Error(`A headless page cannot fetch ${JSON.stringify(url)}.`);
    },
    globals,
    onBuildChanged: () => {
      throw new Error('A headless page is never sent another build.');
    },
    onCallerChanged: () => {
      throw new Error('A headless page is never answered as another caller.');
    },
    router,
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    WebSocket: function HeadlessWebSocket() {
      throw new Error('WebSocket subscriptions need the browser.');
    },
    websocketUrl: (path) => `ws://localhost${path}`,
  };
}

export default createNodeClientHost;
