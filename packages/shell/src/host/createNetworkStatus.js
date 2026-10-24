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

import isOnline from './isOnline.js';

/**
 * The shell's one online state. The NoConnection banner and the app's `online` and `offline`
 * events (createShellHost) read it, and two sources feed it:
 * - the phone's network, through expo-network, read while anything subscribes;
 * - Lowdefy Dev's network injection (`setInjectedOffline`), since a simulator or emulator shares
 *   the computer's network and cannot go offline itself. A release shell never sets it.
 *
 * The shell is online when the phone's network is up and nothing injected offline. Subscribers
 * hear only changes, as a browser fires `online` and `offline`.
 *
 * @param {Object} params
 * @param {Object} params.network expo-network: `addNetworkStateListener` and
 *   `getNetworkStateAsync`.
 */
function createNetworkStatus({ network }) {
  const listeners = new Set();
  let deviceOnline = true;
  let injectedOffline = false;
  let online = true;
  let stopListening = null;

  function settle() {
    const next = deviceOnline && !injectedOffline;
    if (next === online) return;
    online = next;
    [...listeners].forEach((listener) => listener(online));
  }

  function setDeviceState(state) {
    deviceOnline = isOnline(state);
    settle();
  }

  // Reads the phone's network until stopped. A change heard before the first read answers is
  // newer than that read, so the read is then dropped.
  function listen() {
    let heard = false;
    let active = true;
    const subscription = network.addNetworkStateListener((state) => {
      heard = true;
      setDeviceState(state);
    });
    network.getNetworkStateAsync().then((state) => {
      if (active && !heard) setDeviceState(state);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }

  // Calls the listener with the new online state on every change; returns the function that
  // stops it.
  function subscribe(listener) {
    if (listeners.size === 0) {
      stopListening = listen();
    }
    listeners.add(listener);
    return () => {
      if (!listeners.delete(listener)) return;
      if (listeners.size === 0) {
        stopListening();
        stopListening = null;
      }
    };
  }

  function setInjectedOffline(offline) {
    injectedOffline = offline;
    settle();
  }

  return { isOnline: () => online, setInjectedOffline, subscribe };
}

export default createNetworkStatus;
