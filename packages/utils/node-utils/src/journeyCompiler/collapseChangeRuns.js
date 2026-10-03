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

import recordTime from './recordTime.js';

const RUN_WINDOW_MS = 2000;

function runKey({ record }) {
  return `${record.page_id} ${record.target.block_id ?? ''}`;
}

// The recorder writes one `change` per keystroke, and typing into two fields
// alternately writes A,B,A,B,A - so collapsing adjacent duplicates is not
// enough. A run is every change on the same (page, block) whose gap from the
// previous one is at most the window, wherever else the user went in between.
//
// The run keeps the position (and time) of its first record and the value,
// redaction and event of its last: the position is where the user started on
// the field, and the last record carries the value they left in it and the
// event that value caused.
const CONTENT_KEYS = ['value', 'redacted', 'event', 'also'];

function mergeRun({ first, last }) {
  const merged = { ...first };
  CONTENT_KEYS.forEach((key) => {
    if (key in last) {
      merged[key] = last[key];
    } else {
      delete merged[key];
    }
  });
  return merged;
}

function collapseChangeRuns({ records, windowMs = RUN_WINDOW_MS }) {
  const slots = [];
  const openRuns = new Map();
  records.forEach((record) => {
    if (record.kind !== 'change') {
      slots.push({ record });
      return;
    }
    const key = runKey({ record });
    const time = recordTime({ record });
    const open = openRuns.get(key);
    if (open !== undefined && time - open.time <= windowMs) {
      open.record = mergeRun({ first: open.record, last: record });
      open.time = time;
      return;
    }
    const slot = { record, time };
    slots.push(slot);
    openRuns.set(key, slot);
  });
  return slots.map((slot) => slot.record);
}

export { RUN_WINDOW_MS };

export default collapseChangeRuns;
