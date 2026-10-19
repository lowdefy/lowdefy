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

import createDeviceStore from './createDeviceStore.js';
import createMemoryStore from './createMemoryStore.js';
import createShellGlobals from './createShellGlobals.js';
import getOrigin from './getOrigin.js';
import networkStatus from './networkStatus.js';

// The app's `online` and `offline` events follow the shell's one online state.
const network = {
  addListener: networkStatus.subscribe,
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

function createShellHost({ fetch, router, session, streamFetch, tokenStore, WebSocket }) {
  const storage = createDeviceStore();
  return {
    authTransport: 'bearer',
    fetch,
    globals: createShellGlobals({
      assign: (url) => Linking.openURL(url),
      clipboard,
      fetch,
      getInstanceId: session.getCurrentInstanceId,
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
    // The Fetch API whose response body streams, for blocks (client-native's createStreamFetch).
    streamFetch,
    tokenStore,
    WebSocket,
    websocketUrl: (apiPath) => apiPath.replace(/^http/, 'ws'),
  };
}

export default createShellHost;
