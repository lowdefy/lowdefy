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

import { AppState } from 'react-native';
import { getDeviceFeature, hasDeviceFeature } from '@lowdefy/blocks-native/device';

import refreshWidgets from '../widgets/refreshWidgets.js';
import { setCurrentApp } from './currentApp.js';
import startBackgroundFetch from './backgroundFetch.js';
import startNotifications from '../notifications/startNotifications.js';
import startShareIn from './startShareIn.js';
import startShortcuts from './startShortcuts.js';
import whenAppReady from './whenAppReady.js';

/**
 * Starts the native work of the open app once its auth and session exist: notifications, quick
 * actions and App Shortcuts, share-in and background fetch listen at once, and their launch work
 * waits on `app.ready` (whenAppReady: the token read and a root held). Once ready, the app becomes
 * the current app (currentApp.js) for work started outside React, the offline request queue starts
 * and the widgets refresh. When the app goes to the background, a scan screen's brightness goes
 * back to the system.
 *
 * @param {Object} params
 * @param {Object} params.app { apiBase, auth, host, requestQueue, session, shell, triggerAppEvent }.
 * @returns {{ app: Object, shareIn: Object, stop: () => void }}
 */
function startAppServices({ app: opened }) {
  const ready = whenAppReady({ auth: opened.auth, session: opened.session });
  const app = {
    apiBase: opened.apiBase,
    auth: opened.auth,
    fetch: opened.auth.fetch,
    ready: ready.promise,
    requestQueue: opened.requestQueue,
    router: opened.host.router,
    session: opened.session,
    shell: opened.shell,
    tokenStore: opened.auth.tokenStore,
    triggerAppEvent: opened.triggerAppEvent,
  };
  const shareIn = startShareIn({ app });
  // Lowdefy Dev's share injection hands payloads to it (src/dev/inject/injectShare.js).
  app.receiveShare = shareIn.receive;
  let stopped = false;
  const stops = [
    ready.stop,
    startNotifications({ app }),
    startShortcuts({ app }),
    startBackgroundFetch({ app }),
    shareIn.stop,
  ];
  ready.promise.then(() => {
    if (stopped) return;
    setCurrentApp(app);
    stops.push(app.requestQueue.start());
    refreshWidgets().catch(() => {});
  });
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      refreshWidgets().catch(() => {});
      return;
    }
    if (state === 'background' && hasDeviceFeature('brightness')) {
      getDeviceFeature({ feature: 'brightness', action: 'background' })
        .set({ reset: true })
        .catch(() => {});
    }
  });
  stops.push(() => appState.remove());
  return {
    app,
    shareIn,
    stop: () => {
      stopped = true;
      setCurrentApp(null);
      stops.forEach((stop) => stop());
    },
  };
}

export default startAppServices;
