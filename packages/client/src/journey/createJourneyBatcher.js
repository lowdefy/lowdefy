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

// A batch leaves the browser when it reaches `maxEvents`, when `flushMs` has
// passed since the first event in it, or when the page goes away. Each send is
// chunked to `maxBytes` because sendBeacon refuses a body over the browser's
// 64 KB in-flight cap - a long session's pagehide flush is exactly the case
// that exceeds it.
function createJourneyBatcher({
  flushMs = 5000,
  maxBytes = 16 * 1024,
  maxEvents = 20,
  send,
  window,
}) {
  let buffer = [];
  let timer = null;

  function chunk(events) {
    const chunks = [];
    let current = [];
    let size = 0;
    events.forEach((event) => {
      const eventSize = JSON.stringify(event).length;
      if (current.length > 0 && size + eventSize > maxBytes) {
        chunks.push(current);
        current = [];
        size = 0;
      }
      current.push(event);
      size += eventSize;
    });
    if (current.length > 0) {
      chunks.push(current);
    }
    return chunks;
  }

  function flush() {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    if (buffer.length === 0) return;
    const events = buffer;
    buffer = [];
    chunk(events).forEach(send);
  }

  function add(event) {
    buffer.push(event);
    if (buffer.length >= maxEvents) {
      flush();
      return;
    }
    if (timer === null) {
      timer = window.setTimeout(flush, flushMs);
    }
  }

  window.addEventListener('pagehide', flush);

  return { add, flush };
}

export default createJourneyBatcher;
