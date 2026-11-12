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

import captureViewLinks from './captureViewLinks.js';
import createMemoryStore from './createMemoryStore.js';
import createMemoryTokenStore from './createMemoryTokenStore.js';
import createViewLocation from './createViewLocation.js';
import createViewOpenLink from './createViewOpenLink.js';
import createViewSession from './createViewSession.js';
import createViewSockets from './createViewSockets.js';
import createViewWindow from './createViewWindow.js';
import getViewSocketProtocols from './getViewSocketProtocols.js';

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
// - A link out of the view is opened in the browser by the host, never by the
//   frame: globals.window.open and location.assign go through openLink, which
//   hands over http: and https: URLs only (createViewOpenLink).
// - Nothing reloads the frame: its document is the host's cached loader. A
//   build or caller change is told to whoever listens on host.view, which the
//   view entry does.
//
// host.view is what a view adds to the host contract:
//   bridge                    the host bridge (createViewBridge)
//   captureLinks()            catches anchor clicks and window.open in the frame
//                             (captureViewLinks); returns a function that stops it
//   fetchApi(path, init)      a signed-in fetch of an API path such as '/api/user'
//   onBuildChange(listener)   ({ serverBuildId }) the app runs another build
//   onCallerChange(listener)  (stamp) the app answered as another caller
//   onLinkRefused(listener)   ({ url }) the host did not open a link
//   onReload(listener)        () the page asked for a reload
//   openLink({ url })         opens a link in the browser; resolves to true when
//                             the host opened it
//   end({ message })          ends the view: tells the end listeners, closes its
//                             websockets and shows the loader's fallback
//   onEnd(listener)           () the view has ended; the view entry unmounts the
//                             app here, so nothing of the page keeps running
//   isEnded()                 true once the view has ended
// Each on* returns a function that stops the listener.
function createViewHost({ bridge, router, window }) {
  const apiBase = `${bridge.appOrigin}${bridge.basePath}`;
  const tokenStore = createMemoryTokenStore();
  const buildListeners = createListeners();
  const callerListeners = createListeners();
  const reloadListeners = createListeners();
  const endListeners = createListeners();
  const sockets = createViewSockets({ window });
  let ended = false;

  // The view gives way to the loader's fallback: no session can be had, or the
  // app cannot be reached. Nothing the core does next brings the page back,
  // so the page stops too: the end listeners unmount it, which drops its
  // feeds and timers, and then its websockets are closed. The fallback is
  // shown whatever a listener does.
  function end({ message }) {
    if (ended) {
      return;
    }
    ended = true;
    try {
      endListeners.call();
      sockets.closeAll();
    } finally {
      bridge.showFallback({ message });
    }
  }

  const session = createViewSession({
    apiBase,
    bridge,
    fetch: (input, init) => window.fetch(input, init),
    onEnded: end,
    tokenStore,
  });

  // A relative link is one of the app's: its base is the view's address.
  const getLinkBase = () => location.href;
  const links = createViewOpenLink({ bridge, getBase: getLinkBase });

  const location = createViewLocation({
    openUrl: (url) => links.openLink({ url }),
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
      window: createViewWindow({ location, open: links.openWindow, window }),
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
      captureLinks: () =>
        captureViewLinks({
          getBase: getLinkBase,
          openLink: links.openLink,
          openWindow: links.openWindow,
          window,
        }),
      end,
      fetchApi: session.fetchApi,
      isEnded: () => ended,
      onBuildChange: buildListeners.add,
      onCallerChange: callerListeners.add,
      onEnd: endListeners.add,
      onLinkRefused: links.onRefused,
      onReload: reloadListeners.add,
      openLink: links.openLink,
    },
    get WebSocket() {
      return sockets.getWebSocket();
    },
    // The frame's WebSocket takes no headers, so the handshake carries the
    // session as subprotocols, read for every connect. renew asks for a new
    // session first: the websocket client sets it when the last connection
    // may have been refused for an ended one.
    websocketProtocols: async ({ renew } = {}) =>
      getViewSocketProtocols({ token: await session.getToken({ renew }) }),
    // apiBase carries the app's origin, so the path does too.
    websocketUrl: (path) => path.replace(/^http/, 'ws'),
  };
}

export default createViewHost;
