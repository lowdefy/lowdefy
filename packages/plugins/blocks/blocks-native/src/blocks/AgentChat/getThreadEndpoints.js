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

import { type } from '@lowdefy/helpers';

// Each thread endpoint's key in `threads.endpoints`, and its id in the ai-assistant module.
const ENDPOINTS = {
  deleteThread: 'delete-thread',
  getActiveThread: 'get-active-thread',
  getThread: 'get-thread',
  listThreads: 'list-threads',
  saveThread: 'save-thread',
  titleThread: 'title-thread',
};

/**
 * The endpoints a chat keeps its threads through, by what each does. `threads.endpoints` names
 * them; `threads.module`, the id of the app's ai-assistant module entry, names any it leaves out
 * as that module's (`<module>/list-threads` and so on). One with neither is null, and the chat
 * does without it: no list without listThreads, nothing kept without saveThread, no resuming
 * without getActiveThread and no generated titles without titleThread (or with generateTitles
 * false).
 *
 * @param {Object} [threads] The threads property.
 * @returns {Object|null} null when the chat keeps no threads.
 */
function getThreadEndpoints(threads) {
  if (!type.isObject(threads)) return null;
  const named = type.isObject(threads.endpoints) ? threads.endpoints : {};
  const module = type.isString(threads.module) && threads.module !== '' ? threads.module : null;
  const endpoints = Object.fromEntries(
    Object.entries(ENDPOINTS).map(([key, moduleEndpointId]) => {
      if (type.isString(named[key])) return [key, named[key]];
      return [key, module === null ? null : `${module}/${moduleEndpointId}`];
    })
  );
  if (threads.generateTitles === false) {
    endpoints.titleThread = null;
  }
  return endpoints;
}

export default getThreadEndpoints;
