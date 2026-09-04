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

const RUN_WINDOW_MS = 2000;

function runKey({ event }) {
  return `${event.page_id} ${event.block_id} ${event.event_name}`;
}

// Typing into a field fires one onChange per keystroke, and typing into two
// fields alternately fires A,B,A,B,A - so collapsing adjacent duplicates is not
// enough. A run is every occurrence of the same (page, block, event) whose gap
// from the previous occurrence is under the window, wherever else the user went
// in between.
//
// The run keeps the position of its first occurrence and the content of its
// last: the position is where the user started interacting with the field, and
// the content carries the value they finally left in it.
function collapseEventRuns({ events, windowMs = RUN_WINDOW_MS }) {
  const runs = [];
  const openRuns = new Map();
  events.forEach((event) => {
    const key = runKey({ event });
    const time = Date.parse(event.t);
    const open = openRuns.get(key);
    // A trace without parsable timestamps has no window to measure, so nothing
    // collapses rather than everything collapsing.
    if (open !== undefined && !Number.isNaN(time) && time - open.time <= windowMs) {
      open.event = event;
      open.time = time;
      return;
    }
    const run = { event, time };
    runs.push(run);
    openRuns.set(key, run);
  });
  return runs.map((run) => run.event);
}

export { RUN_WINDOW_MS };

export default collapseEventRuns;
