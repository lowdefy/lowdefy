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
// Module-level ring buffer of dev notices — things that are not errors but a
// developer should see while building, currently every `tenant: none`
// execution reported by resolveTenant through context.handleDevNotice. Feeds
// the getBuildStatus feedback endpoint (tenantNotices) beside the client and
// server error stores. Deliberately in-memory only: entries are lost on
// server restart, which is fine since this is a live-session debugging aid.
//
// One notice per config site per process: a `tenant: none` request inside a
// :for loop, or a page the developer keeps reloading, would otherwise flood
// the bar with identical entries. The dedupe is keyed on configKey, so a
// notice with no key is always stored. A restart clears both the buffer and
// the seen set.
const MAX_ENTRIES = 50;

const entries = [];
const seenConfigKeys = new Set();

function push(entry) {
  const configKey = entry.configKey;
  if (configKey !== undefined && configKey !== null) {
    if (seenConfigKeys.has(configKey)) {
      return;
    }
    seenConfigKeys.add(configKey);
  }
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
}

function list() {
  return [...entries];
}

export default { push, list };
