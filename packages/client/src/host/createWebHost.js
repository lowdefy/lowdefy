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

import createWebStore from './createWebStore.js';

// The browser host for @lowdefy/client-core. The browser's own functions are
// read when they are used, as they were before the core was split out.
function createWebHost({ router, window }) {
  return {
    fetch: (input, init) => window.fetch(input, init),
    globals: {
      document: window.document,
      fetch: window.fetch,
      window,
    },
    // The tab reloads onto the current build or caller; the server renders the
    // page again for it.
    onBuildChanged: () => window.location.reload(),
    onCallerChanged: () => window.location.reload(),
    router,
    sessionStorage: createWebStore(() => window.sessionStorage),
    storage: createWebStore(() => window.localStorage),
    get WebSocket() {
      return window.WebSocket;
    },
    websocketUrl: (path) => {
      // An apiBase on another origin carries its own host.
      if (/^https?:\/\//.test(path)) {
        return path.replace(/^http/, 'ws');
      }
      const { location } = window;
      const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
      return `${scheme}://${location.host}${path}`;
    },
  };
}

export default createWebHost;
