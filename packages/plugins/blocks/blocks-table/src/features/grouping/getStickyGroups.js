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

import firstIndexAbove from '../virtualization/firstIndexAbove.js';

// The stacked sticky group headers for a body scroll offset: for each level from the outermost,
// the header of the group the rows under that level's slot belong to (slot `level` sits
// `level` rows below the column header), once it has scrolled (partly) under the slot. A level
// shows only while its parent level shows and holds one of the parent's groups. `shift` (zero or
// negative) pushes a level up as the next header at that level or above arrives beneath it, so a
// new outer group pushes the inner headers out first. Item tops are `rowOffsets` when some items
// are not one row high (detail rows, measured rows), else index times row height; group headers
// themselves are always one row high. `levels` comes from buildStickyLevels.
function getStickyGroups({ levels, rowHeight, rowOffsets, scrollTop }) {
  const groups = [];
  if (scrollTop <= 0) return groups;
  const offsetOf = (index) => (rowOffsets ? rowOffsets[index] : index * rowHeight);
  const rowAt = (offset) =>
    rowOffsets
      ? firstIndexAbove({ offsets: rowOffsets, value: offset }) - 1
      : Math.floor(offset / rowHeight);
  let parent = -1;
  for (let level = 0; level < levels.length; level++) {
    const { own, upTo } = levels[level];
    const slotTop = scrollTop + level * rowHeight;
    const position = firstIndexAbove({ offsets: own, value: rowAt(slotTop) }) - 1;
    if (position < 0) break;
    const index = own[position];
    if (index <= parent || offsetOf(index) >= slotTop) break;
    const next = firstIndexAbove({ offsets: upTo, value: index });
    let shift = 0;
    if (next < upTo.length) {
      shift = Math.min(0, offsetOf(upTo[next]) - slotTop - rowHeight);
      shift = Math.max(shift, -(level + 1) * rowHeight);
    }
    groups.push({ index, shift });
    parent = index;
  }
  return groups;
}

export default getStickyGroups;
