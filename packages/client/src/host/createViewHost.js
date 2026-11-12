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
import createMemoryTokenStore from './createMemoryTokenStore.js';
import createViewLocation from './createViewLocation.js';
import createViewSession from './createViewSession.js';
import createViewWindow from './createViewWindow.js';

function createListeners() {
  const listeners = new Set();
  return {
    add: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    call: (value) => listeners.forEach((listener) => listener(value)),
  };
}

// The @lowdefy/client-core host for a page shown as an MCP App view: the web
// client running in a host's sandbox frame, on another origin than its app.
//
// - Calls go to the app's absolute origin (apiBase) with a bearer session,
//   never a cookie. The token is held in memory only; a 401 mints a new one
//   and sends the call again (createViewSession).
// - Both stores are in memory: the frame's own storage belongs to the host's
//   sandbox origin.
// - globals.window.location is the view's address on the app's origin, kept in
//   the router, not the frame's location.
// - Nothing reloads the frame: its document is the host's cached loader. A
//   build or caller change is told to whoever listens on host.view, which the
//   view entry does.
//
// host.view is what a view adds to the host contract:
//   bridge                    the host bridge (createViewBridge)
//   fetchApi(path, init)      a signed-in fetch of an API path such as '/api/user'
//   onBuildChange(listener)   ({ serverBuildId }) the app runs another build
//   onCallerChange(listener)  (stamp) the app answered as another caller
//   onReload(listener)        () the page asked for a reload
//   isEnded()                 true once the view has shown its fallback
// Each on* returns a function that stops the listener.
function createViewHost({ bridge, router, window }) {
  const apiBase = `${bridge.appOrigin}${bridge.basePath}`;
  const tokenStore = createMemoryTokenStore();
  const buildListeners = createListeners();
  const callerListeners = createListeners();
  const reloadListeners = createListeners();
  let ended = false;

  // The view gives way to the loader's fallback: no session can be had, or the
  // app cannot be reached. Nothing the core does next brings the page back.
  function end({ message }) {
    if (ended) {
      return;
    }
    ended = true;
    bridge.showFallback({ message });
  }

  const session = createViewSession({
    apiBase,
    bridge,
    fetch: (input, init) => window.fetch(input, init),
    onEnded: end,
    tokenStore,
  });

  const location = createViewLocation({
    openUrl: (url) => bridge.openLink({ url }),
    origin: bridge.appOrigin,
    reload: () => reloadListeners.call(),
    router,
  });

  return {
    apiBase,
    authTransport: 'bearer',
    fetch: session.fetch,
    globals: {
      document: window.document,
      // The Fetch action's fetch: never signed in with the view's session.
      fetch: (input, init) => window.fetch(input, init),
      window: createViewWindow({ location, window }),
    },
    onBuildChanged: ({ serverBuildId } = {}) => {
      if (!ended) {
        buildListeners.call({ serverBuildId });
      }
    },
    // The core also calls this after a 401 that a new session did not cure;
    // the view has ended by then.
    onCallerChanged: (stamp) => {
      if (!ended) {
        callerListeners.call(stamp);
      }
    },
    router,
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    tokenStore,
    view: {
      bridge,
      end,
      fetchApi: session.fetchApi,
      isEnded: () => ended,
      onBuildChange: buildListeners.add,
      onCallerChange: callerListeners.add,
      onReload: reloadListeners.add,
    },
    get WebSocket() {
      return window.WebSocket;
    },
    // apiBase carries the app's origin, so the path does too.
    websocketUrl: (path) => path.replace(/^http/, 'ws'),
  };
}

export default createViewHost;
