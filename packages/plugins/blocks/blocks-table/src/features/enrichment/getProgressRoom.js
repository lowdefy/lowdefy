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

import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import getFilteredKeys from '../filtering/getFilteredKeys.js';

// The header indicators' widths, matching their CSS: the sort arrows (table.css `.lf-table-sort`)
// and the filter button (`.lf-table-header-button`). The menu button and resize handle lie over
// the header, so they take no room.
const SORT_WIDTH = 8;
const FILTER_WIDTH = 20;

// The room a header's progress chip has: the column's width less the cell padding, the title
// (measured, never cut for the chip), and the sort and filter indicators it shows, each with the
// header's gap. Text widths come from the table's text measure, so a width change costs a few
// cached reads.
function getProgressRoom({ api, col, state }) {
  const measure = api.textMeasure;
  const gap = measure.headerGap;
  let used = measure.cellInset + measure.headerTitle(htmlToText(col.column.title)) + gap;
  if (col.column.sortable) used += SORT_WIDTH + gap;
  if (getFilteredKeys(state.filter).has(col.key)) used += FILTER_WIDTH + gap;
  return col.width - used;
}

export default getProgressRoom;
