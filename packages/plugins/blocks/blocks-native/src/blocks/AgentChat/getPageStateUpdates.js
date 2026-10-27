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

import { isReserved, setKey, type } from '@lowdefy/helpers';

/**
 * What the update-page-state client tool may write, as the web block allows it: only keys the chat
 * shares with the agent (`sharedState`), and never a reserved key. A key the agent made up is not
 * written; it is reported back as ignored, so the model can correct itself on its next turn.
 *
 * @param {Object} params
 * @param {Object|null} params.sharedState The shared state the chat sent this turn.
 * @param {Object} [params.updates] The tool input's updates.
 * @returns {{ writable: Object, output: { ok: true, written: string[], ignored?: string[] } }}
 */
function getPageStateUpdates({ sharedState, updates }) {
  const allowedKeys = new Set(Object.keys(sharedState ?? {}));
  const writable = {};
  const ignored = [];
  Object.entries(type.isObject(updates) ? updates : {}).forEach(([key, value]) => {
    if (!allowedKeys.has(key) || isReserved(key)) {
      ignored.push(key);
      return;
    }
    setKey(writable, key, value);
  });
  return {
    writable,
    output: {
      ok: true,
      written: Object.keys(writable),
      ...(ignored.length > 0 ? { ignored } : {}),
    },
  };
}

export default getPageStateUpdates;
