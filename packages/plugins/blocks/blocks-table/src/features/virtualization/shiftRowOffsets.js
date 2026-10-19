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

// Applies height changes to row offsets (item tops, the total height last) in place: each change
// `{ index, delta }` moves the tops of every item after `index` by `delta`. Only the offsets from
// the first changed item on are touched, with one running sum, instead of recomputing every
// item's height.
function shiftRowOffsets({ offsets, changes }) {
  if (changes.length === 0) return offsets;
  const sorted = [...changes].sort((a, b) => a.index - b.index);
  let shift = 0;
  let next = 0;
  for (let i = sorted[0].index + 1; i < offsets.length; i++) {
    while (next < sorted.length && sorted[next].index < i) {
      shift += sorted[next].delta;
      next += 1;
    }
    offsets[i] += shift;
  }
  return offsets;
}

export default shiftRowOffsets;
