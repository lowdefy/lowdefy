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

import { translate, type } from '@lowdefy/helpers';
import { createBrowserLogger } from '@lowdefy/logger/browser';

import createAuthMethods from './auth/createAuthMethods.js';
import validateAuthTransport from './auth/validateAuthTransport.js';
import createCallAPI from './createCallAPI.js';
import createCallRequest from './createCallRequest.js';
import createHandleError from './createHandleError.js';
import createStorage from './storage/createStorage.js';
import createWebSocketClient from './websocket/createWebSocketClient.js';

// What a renderer gives the core to reach its platform. A store is
// { get(key), set(key, value), remove(key), keys() }, holding strings; its
// methods may throw when the platform blocks storage, and the core catches that.
const HOST_KEYS = [
  'fetch', // fetch(url, init), as the Fetch API.
  'globals', // the platform objects the engine and its plugins reach.
  'onBuildChanged', // ({ serverBuildId }) the server runs another build than this client.
  'onCallerChanged', // (stamp) the server answered as another caller, or refused this one.
  'router', // the router adapter: push, replace and back.
  'sessionStorage', // a store that lasts as long as the tab or app session.
  'storage', // a store that lasts on the device.
  'WebSocket', // the WebSocket constructor.
  'websocketUrl', // (path) the socket URL for an API path such as `${apiBase}/api/websocket`.
];
// A host may also give authTransport ('cookie', the default, or 'bearer') and,
// for bearer, tokenStore: see validateAuthTransport. A host that keeps calls
// while offline gives requestQueue, { send({ body, buildId, pageId, requestId,
// send, url }) }, which `offline: queue` requests go through (createCallRequest).

// Builds lowdefy._internal and the app-level state of the lowdefy object for a
// renderer: requests, endpoint calls, the websocket client, auth methods,
// storage keys, translation, logging and error handling. The renderer then adds
// what draws the page (block components, icons, links) to
// lowdefy._internal.components.
//
// apiBase prefixes every API call. It is basePath on the web, where the API is
// served under the app's own path; a native shell passes its server's origin.
// basePath keeps its routing meaning (history URLs and storage keys).
function createLowdefyCore({ apiBase, auth, basePath, host, lowdefy, rootConfig, types }) {
  if (!type.isObject(host)) {
    throw new Error(`Lowdefy client host is not an object. Received ${JSON.stringify(host)}.`);
  }
  const missing = HOST_KEYS.filter((key) => !(key in host));
  if (missing.length > 0) {
    throw new Error(`Lowdefy client host is missing ${missing.join(', ')}.`);
  }
  validateAuthTransport({ host });
  // The path memory lasts the session. A dev config reload clears initialised
  // to rebuild the page contexts, but the paths this tab followed still name
  // the same pages, and the page response it fetches next rewrites its own.
  if (type.isUndefined(lowdefy.pathMemory)) {
    lowdefy.pathMemory = new Map();
  }
  lowdefy._internal = {
    actions: types.actions,
    blockComponents: types.blocks,
    blockMetas: types.blockMetas ?? {},
    // The last caller stamp a response carried (recordCallerStamp). It names
    // the session, not the page context, so it outlives a dev config reload,
    // and the dev server records the first page config's before this runs.
    callerStamp: lowdefy._internal?.callerStamp ?? null,
    components: {},
    // Caps for the engine's event and call histories. Unset in production; the dev client
    // entry sets it before this runs, so it outlives a dev config reload like callerStamp.
    historyLimits: lowdefy._internal?.historyLimits,
    displayMessage: ({ content }) => {
      console.log(content);
      return () => undefined;
    },
    globals: host.globals,
    host,
    initialised: true,
    link: () => undefined,
    operators: types.operators,
    progress: {
      state: {
        progress: 0,
      },
      dispatch: () => undefined,
    },
    router: host.router,
  };
  lowdefy.apiBase = apiBase ?? basePath;
  lowdefy.apiResponses = {};
  // Rebuilt with the page contexts, so a dev config reload runs the app events again.
  lowdefy.appContext = null;
  lowdefy.basePath = basePath;
  lowdefy.contexts = {};
  lowdefy.inputs = {};
  lowdefy.pageInstances = {};
  lowdefy.lowdefyApp = rootConfig.lowdefyApp;
  lowdefy.lowdefyGlobal = rootConfig.lowdefyGlobal;
  lowdefy.theme = rootConfig.theme ?? {};
  lowdefy._internal.storage = createStorage({
    basePath,
    getUserId: () => lowdefy.user?.id ?? null,
    sessionStorage: host.sessionStorage,
    slug: lowdefy.lowdefyApp?.slug,
    storage: host.storage,
  });

  lowdefy._internal.callAPI = createCallAPI(lowdefy);
  lowdefy._internal.auth = createAuthMethods(lowdefy, auth);
  lowdefy._internal.callRequest = createCallRequest(lowdefy);
  lowdefy._internal.websocketClient = createWebSocketClient(lowdefy);
  lowdefy._internal.translate = (key, values) => translate({ key, values, i18n: lowdefy.i18n });
  lowdefy._internal.logger = createBrowserLogger();
  lowdefy._internal.handleError = createHandleError(lowdefy);
  return lowdefy;
}

export { HOST_KEYS };
export default createLowdefyCore;
