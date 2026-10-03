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

// Readers poll a dev instance record (every 100 ms while waiting on a build),
// and a start time costs a ps process (PowerShell on Windows), so it is read
// once a few seconds per pid. read may return a value or a promise; either is
// kept as it is.
function createStartTimeCache({ read, ttlMs = 5000 }) {
  const startTimes = new Map();

  return function readCached({ pid }) {
    const now = Date.now();
    const cached = startTimes.get(pid);
    if (!type.isUndefined(cached) && now - cached.readAt < ttlMs) {
      return cached.startTime;
    }
    startTimes.forEach((entry, key) => {
      if (now - entry.readAt >= ttlMs) {
        startTimes.delete(key);
      }
    });
    const startTime = read({ pid });
    startTimes.set(pid, { startTime, readAt: now });
    return startTime;
  };
}

export default createStartTimeCache;
