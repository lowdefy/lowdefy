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

import sessionSequence from './sessionSequence.js';

// The coverage denominator: every (page, block, event) triple the trace saw,
// with the number of sessions that drove it, ranked so the most-used uncovered
// triple is the next test to write.
//
// It is the same normalisation the clustering uses, so mount-class events are
// out of it: no journey verb can exercise one, and leaving them in would pin
// coverage below 100% forever.
function traceTriples({ sessions }) {
  const counts = new Map();
  sessions.forEach((session) => {
    const seen = new Set();
    sessionSequence({ session }).forEach((triple) => {
      const key = `${triple.page_id} ${triple.block_id} ${triple.event_name}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!counts.has(key)) counts.set(key, { ...triple, sessions: 0 });
      counts.get(key).sessions += 1;
    });
  });

  return [...counts.values()].sort((a, b) => {
    if (b.sessions !== a.sessions) return b.sessions - a.sessions;
    return `${a.page_id} ${a.block_id} ${a.event_name}`.localeCompare(
      `${b.page_id} ${b.block_id} ${b.event_name}`
    );
  });
}

export default traceTriples;
