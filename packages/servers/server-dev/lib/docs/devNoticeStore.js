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

import createRingBuffer from './createRingBuffer.js';
import { publish } from './devEventBus.js';

// Module-level ring buffer of dev notices — things that are not errors but a
// developer should see while building: every `tenant: none` execution and
// every `runAs` scope reported through context.handleDevNotice. Feeds the
// getBuildStatus feedback endpoint (devNotices) beside the client and server
// error stores, and the dev tabs through the dev_notice event on
// devEventBus. Deliberately in-memory only: entries are lost on server
// restart, which is fine since this is a live-session debugging aid.
//
// One notice per config site: a `tenant: none` request inside a :for loop, or
// a page the developer keeps reloading, would otherwise flood the bar with
// identical entries, so repeats only raise the entry's count. The dedupe is
// keyed on configKey, so a notice with no key is always stored.
const MAX_ENTRIES = 50;

export default createRingBuffer({
  max: MAX_ENTRIES,
  dedupeKey: (entry) => entry.configKey,
  onStore: (entry) => publish({ ...entry, type: 'dev_notice' }),
});
