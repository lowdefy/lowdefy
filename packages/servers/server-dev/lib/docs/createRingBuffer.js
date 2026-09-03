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

// The one buffer behind the three dev feedback stores (client errors, server
// errors, dev notices). All three are bounded in-memory lists of recent events
// that are also pushed to the dev event bus, and all three need the same
// dedupe: a broken request inside a :for loop, or a page the developer keeps
// reloading, would otherwise fill every slot with the same entry and evict
// everything else — turning the agent's feedback channel into a wall of one
// message. A duplicate updates `count` and `lastSeen` on the entry already
// held rather than adding a new one.
//
// `push` returns whether it stored a new entry. Consumers need that answer:
// inferring it from the list length is wrong once the ring is at capacity,
// where a stored entry also evicts one and leaves the length unchanged.
//
// The `seen` index is pruned when its entry is evicted, so a site that fell
// out of the ring can be reported again — an app with more distinct sites than
// the ring holds shows the recent ones rather than an arbitrary first N.
function createRingBuffer({ max, dedupeKey, onStore }) {
  if (!type.isInt(max) || max < 1) {
    throw new Error(`createRingBuffer requires a "max" integer. Received ${JSON.stringify(max)}.`);
  }
  if (!type.isFunction(dedupeKey)) {
    throw new Error('createRingBuffer requires a "dedupeKey" function.');
  }
  if (!type.isFunction(onStore)) {
    throw new Error('createRingBuffer requires an "onStore" function.');
  }

  const entries = [];
  const seen = new Map();

  function evictOldest() {
    const evicted = entries.shift();
    const key = dedupeKey(evicted);
    if (seen.get(key) === evicted) {
      seen.delete(key);
    }
  }

  function push(entry) {
    // A null key means "not dedupable" — a notice with no config site, or an
    // error with nothing identifying it — and is always stored.
    const key = dedupeKey(entry);
    if (!type.isNone(key)) {
      const stored = seen.get(key);
      if (!type.isNone(stored)) {
        stored.count = (stored.count ?? 1) + 1;
        stored.lastSeen = entry.timestamp ?? new Date().toISOString();
        return false;
      }
      seen.set(key, entry);
    }
    entries.push(entry);
    if (entries.length > max) {
      evictOldest();
    }
    onStore(entry);
    return true;
  }

  function list() {
    return [...entries];
  }

  return { push, list };
}

export default createRingBuffer;
