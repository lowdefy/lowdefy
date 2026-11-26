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

function countValues(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

// Values one side holds more often than the other, each repeated by how many
// more times it holds it, up to limit, and how many there are in all.
function surplus({ counts, other, limit }) {
  const values = [];
  let total = 0;
  for (const [value, count] of counts) {
    const extra = count - (other.get(value) ?? 0);
    if (extra <= 0) continue;
    total += extra;
    for (let index = 0; index < extra && values.length < limit; index++) {
      values.push(value);
    }
  }
  return { total, values };
}

// Compares two lists of strings as multisets: the same values, as many times
// each, in any order. Returns { identical, baselineCount, currentCount,
// onlyBaseline, onlyCurrent }, each only-list being { total, values } with up
// to limit values.
function compareMultisets({ baseline, current, limit = 20 }) {
  const baselineCounts = countValues(baseline);
  const currentCounts = countValues(current);
  const onlyBaseline = surplus({ counts: baselineCounts, other: currentCounts, limit });
  const onlyCurrent = surplus({ counts: currentCounts, other: baselineCounts, limit });
  return {
    identical: onlyBaseline.total === 0 && onlyCurrent.total === 0,
    baselineCount: baseline.length,
    currentCount: current.length,
    onlyBaseline,
    onlyCurrent,
  };
}

export default compareMultisets;
