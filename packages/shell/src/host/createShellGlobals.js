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

import { createNativeGlobals } from '@lowdefy/client-native';

/**
 * The host globals of one app in the shell: @lowdefy/client-native's (the shown route, window
 * size, visibility, network and the pages' elements), and the device services the shell's native
 * actions reach (src/actions):
 * - `clipboard`: `{ setString(text) }`, for CopyToClipboard.
 * - `storage`: the device store the core keeps the app's and its users' keys in
 *   (`{ get, set, remove, keys }`), for the local storage actions. Sign-out clears the user keys
 *   from it.
 * - `shownScreen`: `{ instanceId }`, the route instance of the focused screen, whose page context
 *   is keyed by it (client-native LowdefyPage); Lowdefy Dev finds the shown page's context by it.
 *
 * @param {Object} params
 * @param {(url: string) => void} params.assign
 * @param {{ setString: (text: string) => Promise<void> }} params.clipboard
 * @param {Function} params.fetch
 * @param {() => (string|null)} params.getInstanceId The focused screen's route instance.
 * @param {() => string} params.getPath
 * @param {Object} [params.network]
 * @param {string} params.origin
 * @param {Object} params.storage
 */
function createShellGlobals({
  assign,
  clipboard,
  fetch,
  getInstanceId,
  getPath,
  network,
  origin,
  storage,
}) {
  return {
    ...createNativeGlobals({ assign, fetch, getPath, network, origin }),
    clipboard,
    shownScreen: {
      get instanceId() {
        return getInstanceId();
      },
    },
    storage,
  };
}

export default createShellGlobals;
