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

import { AppState, Dimensions } from 'react-native';

import createElementRegistry from '../elements/createElementRegistry.js';
import createNativeLocation from './createNativeLocation.js';

function visibilityOf(appState) {
  return appState === 'active' ? 'visible' : 'hidden';
}

// Listeners are kept per event name and listener, so removeEventListener finds the subscription
// addEventListener made.
function createListenerRegistry(subscribers) {
  const subscriptions = new Map();
  return {
    addEventListener(name, listener) {
      const subscribe = subscribers[name];
      if (!subscribe) return;
      subscriptions.set(name, [
        ...(subscriptions.get(name) ?? []),
        { listener, remove: subscribe(listener) },
      ]);
    },
    removeEventListener(name, listener) {
      const entries = subscriptions.get(name) ?? [];
      entries.filter((entry) => entry.listener === listener).forEach((entry) => entry.remove());
      subscriptions.set(
        name,
        entries.filter((entry) => entry.listener !== listener)
      );
    },
  };
}

/**
 * The host globals (@lowdefy/engine getGlobals) for a React Native host, as plain objects under
 * the same `window` and `document` keys the browser fills.
 *
 * - `window.location` is the shown route on the app's origin, read through `getPath` each time.
 * - `window.innerWidth` and `innerHeight` are the window's size from `Dimensions`; a `resize`
 *   listener follows `Dimensions` changes (rotation, split screen).
 * - `document.visibilityState` follows `AppState`; `visibilitychange` fires when it changes.
 * - `online` and `offline` follow `network`, when the shell gives one.
 * - `elements` finds the native views of the pages on screen by block id (createElementRegistry),
 *   for native actions such as SetFocus and ScrollTo.
 *
 * @param {Object} params
 * @param {(url: string) => void} params.assign Opens a URL, for `location.assign` (auth flows).
 * @param {Function} params.fetch The Fetch API.
 * @param {() => string} params.getPath The shown route: path, query string and hash.
 * @param {{ addListener: (listener: (online: boolean) => void) => (() => void) }} [params.network]
 * @param {string} params.origin The app server's origin, such as 'https://app.example.com'.
 */
function createNativeGlobals({ assign, fetch, getPath, network, origin }) {
  const location = createNativeLocation({ assign, getPath, origin });
  const networkListener = (online) => (listener) =>
    network.addListener((isOnline) => {
      if (isOnline === online) listener({ type: online ? 'online' : 'offline' });
    });
  const window = {
    ...createListenerRegistry({
      resize: (listener) => {
        const subscription = Dimensions.addEventListener('change', () => listener({}));
        return () => subscription.remove();
      },
      ...(network ? { online: networkListener(true), offline: networkListener(false) } : {}),
    }),
    get innerHeight() {
      return Dimensions.get('window').height;
    },
    get innerWidth() {
      return Dimensions.get('window').width;
    },
    location,
  };
  const document = {
    ...createListenerRegistry({
      visibilitychange: (listener) => {
        const subscription = AppState.addEventListener('change', () => listener({}));
        return () => subscription.remove();
      },
    }),
    get visibilityState() {
      return visibilityOf(AppState.currentState);
    },
  };
  return { document, elements: createElementRegistry(), fetch, window };
}

export default createNativeGlobals;
