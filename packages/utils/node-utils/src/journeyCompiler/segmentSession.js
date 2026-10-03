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

import classifyPageview from './classifyPageview.js';
import recordTime from './recordTime.js';

const IDLE_MS = 5 * 60 * 1000;

// A segment is one visit to an entry page and the flow it leads to. It starts
// at the session's first record, after 5 minutes idle, or at a pageview the
// segment did not cause (a typed URL, a reload, the dev server reloading after
// a config edit). Sessions repeat from where they enter, so this is the unit
// clustering can find repeats in. A caused pageview stays in the segment as a
// copy marked `caused: true`; inputs are never mutated.
function segmentSession({ records }) {
  const segments = [];
  let current = [];
  records.forEach((record, index) => {
    const previous = records[index - 1];
    const idle = index > 0 && recordTime({ record }) - recordTime({ record: previous }) > IDLE_MS;
    if (idle && current.length > 0) {
      segments.push(current);
      current = [];
    }
    if (record.kind === 'pageview' && current.length > 0) {
      if (classifyPageview({ pageview: record, previous: current })) {
        current.push({ ...record, caused: true });
        return;
      }
      segments.push(current);
      current = [];
    }
    current.push(record);
  });
  if (current.length > 0) segments.push(current);
  return segments;
}

export default segmentSession;
