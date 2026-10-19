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

// The display order of `count` rows as a Uint32Array of row indices, sorted over precomputed
// Float64 keys per sort entry (`[{ keys, desc }]`) instead of row objects. Ties keep source
// order, and empty values (NaN keys) sort last whichever the direction.
function sortIndices({ count, entries }) {
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) order[i] = i;
  const entryCount = entries.length;
  order.sort((a, b) => {
    for (let e = 0; e < entryCount; e++) {
      const { keys, desc } = entries[e];
      const left = keys[a];
      const right = keys[b];
      if (left !== right) {
        const leftEmpty = Number.isNaN(left);
        const rightEmpty = Number.isNaN(right);
        if (leftEmpty && rightEmpty) continue;
        if (leftEmpty) return 1;
        if (rightEmpty) return -1;
        return desc ? right - left : left - right;
      }
    }
    return a - b;
  });
  return order;
}

export default sortIndices;
