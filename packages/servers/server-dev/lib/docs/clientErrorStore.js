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

import createRingBuffer from './createRingBuffer.js';
import { publish } from './devEventBus.js';

// Module-level ring buffer of recent client-reported errors — feeds the
// getBuildStatus feedback endpoint so agents can see browser errors without
// tailing server logs. Deliberately in-memory only: entries are lost on
// server restart, which is fine since this is a live-session debugging aid.
//
// Deduped on the same key as the server errors: a render error repeats on
// every re-render, and fifty copies of it would hide every other error.
const MAX_ENTRIES = 50;

function dedupeKey(entry) {
  if (type.isNone(entry.name) && type.isNone(entry.message)) {
    return null;
  }
  return JSON.stringify([entry.name ?? null, entry.message ?? null, entry.source ?? null]);
}

export default createRingBuffer({
  max: MAX_ENTRIES,
  dedupeKey,
  // Spread first: an entry key named `type` must not be able to overwrite the
  // event type and make the bus drop the event.
  onStore: (entry) => publish({ ...entry, type: 'client_error' }),
});
