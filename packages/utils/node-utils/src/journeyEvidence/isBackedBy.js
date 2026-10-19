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

// Whether a production segment did what a journey does: the journey's
// sequence is an in-order subsequence of the segment's, gaps allowed, matched
// greedy-earliest from the segment's first entry on the journey's page. An
// entry matches when its page and step identity are equal. Both sides come
// from journeySequence, so the compiler and evidence read steps one way. The
// answer is per segment: callers count a segment once per journey.
function isBackedBy({ journeySequence, segmentSequence, pageId }) {
  if (journeySequence.length === 0) return false;
  const start = segmentSequence.findIndex((entry) => entry.page === pageId);
  if (start === -1) return false;
  let next = 0;
  for (let index = start; index < segmentSequence.length; index += 1) {
    const entry = segmentSequence[index];
    const wanted = journeySequence[next];
    if (entry.page === wanted.page && entry.identity === wanted.identity) {
      next += 1;
      if (next === journeySequence.length) return true;
    }
  }
  return false;
}

export default isBackedBy;
