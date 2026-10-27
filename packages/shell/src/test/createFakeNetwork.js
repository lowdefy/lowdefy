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

const ONLINE = { type: 'WIFI', isConnected: true, isInternetReachable: true };

// expo-network as createNetworkStatus reads it, with the phone's network state set by the test.
function createFakeNetwork({ state: initial = ONLINE } = {}) {
  const listeners = new Set();
  let state = initial;
  return {
    addNetworkStateListener(listener) {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
    getNetworkStateAsync: async () => state,
    // The phone's network changes, as expo-network reports it.
    change(next) {
      state = next;
      listeners.forEach((listener) => listener(next));
    },
    listening: () => listeners.size > 0,
  };
}

export const OFFLINE = { type: 'NONE', isConnected: false, isInternetReachable: false };
export { ONLINE };
export default createFakeNetwork;
