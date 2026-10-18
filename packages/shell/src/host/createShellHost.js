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

import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Network from 'expo-network';

import createDeviceStore from './createDeviceStore.js';
import createMemoryStore from './createMemoryStore.js';
import createShellGlobals from './createShellGlobals.js';
import getOrigin from './getOrigin.js';
import isOnline from './isOnline.js';

const network = {
  addListener(listener) {
    const subscription = Network.addNetworkStateListener((state) => listener(isOnline(state)));
    return () => subscription.remove();
  },
};

/**
 * The @lowdefy/client-core host for one app in the shell. Calls are signed in with the session
 * token as a bearer token. The core's build and caller handling lands on the session: a page
 * request refused for another build is retried by `fetch` (createShellFetch) or rebuilds the
 * screens (onBuildChanged); another caller resets the app (onCallerChanged).
 */
const clipboard = {
  setString: (text) => Clipboard.setStringAsync(text),
};

function createShellHost({ fetch, router, session, tokenStore }) {
  const storage = createDeviceStore();
  return {
    authTransport: 'bearer',
    fetch,
    globals: createShellGlobals({
      assign: (url) => Linking.openURL(url),
      clipboard,
      fetch,
      getPath: session.getCurrentPath,
      network,
      origin: getOrigin(session.apiBase),
      storage,
    }),
    onBuildChanged: () => {
      session.handleBuildChanged();
    },
    onCallerChanged: () => {
      session.handleCallerChanged();
    },
    router,
    sessionStorage: createMemoryStore(),
    storage,
    tokenStore,
    WebSocket: globalThis.WebSocket,
    websocketUrl: (apiPath) => apiPath.replace(/^http/, 'ws'),
  };
}

export default createShellHost;
