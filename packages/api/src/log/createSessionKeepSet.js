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

// A bounded set of session ids whose wide events must be kept, whatever the
// configured sample rate says. Insertion-ordered Map as an LRU: `keep` on a
// session already held moves it to the newest position, and the oldest entry
// is dropped once `max` is reached, so the set never grows past `max` ids.
function createSessionKeepSet({ max }) {
  const sessions = new Map();

  function has(sessionId) {
    if (!type.isString(sessionId)) {
      return false;
    }
    return sessions.has(sessionId);
  }

  function keep(sessionId) {
    if (!type.isString(sessionId)) {
      return;
    }
    sessions.delete(sessionId);
    sessions.set(sessionId, true);
    if (sessions.size > max) {
      sessions.delete(sessions.keys().next().value);
    }
  }

  function size() {
    return sessions.size;
  }

  return { has, keep, size };
}

export default createSessionKeepSet;
