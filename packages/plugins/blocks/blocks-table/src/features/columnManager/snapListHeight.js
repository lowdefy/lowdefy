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

import updateScrollHints from './updateScrollHints.js';

// Sizes the column manager list to `limit` (the room below its anchor, getListRoom), capped at
// the last whole entry that fits, so no entry is cut in half above the popover footer; entries
// have different heights (items, boundaries, headings), so the cap is found from the rendered
// entries. Then updates the scroll hints.
function snapListHeight({ limit, list }) {
  list.style.maxHeight = '';
  if (list.scrollHeight <= limit) {
    updateScrollHints(list);
    return;
  }
  let height = 0;
  for (const entry of list.children) {
    const bottom = entry.offsetTop + entry.offsetHeight;
    if (bottom > limit) break;
    height = bottom;
  }
  list.style.maxHeight = `${height}px`;
  updateScrollHints(list);
}

export default snapListHeight;
