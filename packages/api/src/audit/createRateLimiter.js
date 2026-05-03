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

const REPORT_INTERVAL_MS = 60000;

function createRateLimiter({ perSecond, now = Date.now, onDrop }) {
  if (!perSecond || perSecond <= 0) {
    return {
      check: () => true,
      droppedSinceLastReport: () => 0,
    };
  }

  let windowStart = now();
  let countInWindow = 0;
  let dropped = 0;
  let lastReport = now();

  function reportIfDue() {
    const ts = now();
    if (dropped === 0) return;
    if (ts - lastReport < REPORT_INTERVAL_MS) return;
    if (onDrop) onDrop(dropped);
    dropped = 0;
    lastReport = ts;
  }

  function check() {
    const ts = now();
    if (ts - windowStart >= 1000) {
      windowStart = ts;
      countInWindow = 0;
    }
    reportIfDue();
    if (countInWindow >= perSecond) {
      dropped += 1;
      return false;
    }
    countInWindow += 1;
    return true;
  }

  return {
    check,
    droppedSinceLastReport: () => dropped,
    flushReport: () => {
      const total = dropped;
      dropped = 0;
      lastReport = now();
      return total;
    },
  };
}

export default createRateLimiter;
