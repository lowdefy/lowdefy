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

const NONE = { index: -1, shift: 0 };

// The group header the sticky overlay shows for a body scroll offset: the last header at or
// above the top row, once that header has scrolled (partly) out of view. `shift` (zero or
// negative) pushes the overlay up as the next header arrives beneath it. Rows have one fixed
// height, so list index times row height is each header's offset.
function getStickyGroup({ groupIndices, rowHeight, scrollTop }) {
  if (scrollTop <= 0 || groupIndices.length === 0) return NONE;
  const top = Math.floor(scrollTop / rowHeight);
  const position = firstIndexAbove({ offsets: groupIndices, value: top }) - 1;
  if (position < 0) return NONE;
  const index = groupIndices[position];
  if (index * rowHeight >= scrollTop) return NONE;
  let shift = 0;
  if (position + 1 < groupIndices.length) {
    shift = Math.min(0, groupIndices[position + 1] * rowHeight - scrollTop - rowHeight);
  }
  return { index, shift };
}

export default getStickyGroup;
