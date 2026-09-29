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

import isDataItem from '../../core/isDataItem.js';

// A drop gap in the displayed list (`api.rows`: the current page, detail rows included) as a gap
// in every data row in display order (`api.dataRows`): the index of the first data row at or
// after it, or one past the last data row before it. A gap stays within the page, so a row
// dragged (or moved with the keys) past the page's edge lands at that edge.
function getDataGap({ api, gap }) {
  const clamped = Math.min(Math.max(gap, 0), api.rows.length);
  const next = api.rows.slice(clamped).find(isDataItem);
  if (next !== undefined) return api.dataRows.findIndex((row) => row.id === next.id);
  const previous = api.rows.slice(0, clamped).findLast(isDataItem);
  if (previous !== undefined) return api.dataRows.findIndex((row) => row.id === previous.id) + 1;
  return 0;
}

export default getDataGap;
