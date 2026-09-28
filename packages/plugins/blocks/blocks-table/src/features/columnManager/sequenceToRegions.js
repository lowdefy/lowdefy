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

import boundaryIds from './boundaryIds.js';

// Reads the column regions back from the manager list: columns above the start boundary are
// start-pinned, other columns below the end boundary are end-pinned, the rest are the centre.
function sequenceToRegions(sequence) {
  const startIndex = sequence.findIndex((entry) => entry.id === boundaryIds.start);
  const endIndex = sequence.findIndex((entry) => entry.id === boundaryIds.end);
  const regions = { start: [], center: [], end: [] };
  sequence.forEach((entry, index) => {
    if (entry.boundary) return;
    if (index < startIndex) {
      regions.start.push(entry.key);
    } else if (index > endIndex) {
      regions.end.push(entry.key);
    } else {
      regions.center.push(entry.key);
    }
  });
  return regions;
}

export default sequenceToRegions;
