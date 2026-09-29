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

import buildLayout from './buildLayout.js';
import columnSizes from './columnSizes.js';
import resolveViewColumns from './resolveViewColumns.js';

function getRegion(pinned) {
  if (pinned === 'start') return 'start';
  if (pinned === 'end') return 'end';
  return 'center';
}

// The layout the table will have, from the column config alone (no TanStack): the view's column
// order, visibility, pins and widths (resolveViewColumns, as the table's initial state resolves
// them) and the leading columns, through the engine's buildLayout. The lazy block's fallback lays
// its header and skeleton rows out with it, so the swap to the table does not move a column.
function computeFallbackLayout({ columns, defaultView, leadingColumns, value, viewportWidth }) {
  const byKey = new Map(columns.map((column) => [column.key, column]));
  const regions = { start: [], center: [], end: [] };
  const sizing = {};
  resolveViewColumns({ value, defaultView, columns }).forEach((entry) => {
    if (entry.hidden) return;
    const column = byKey.get(entry.key);
    const minWidth = column.minWidth ?? columnSizes.minWidth;
    const maxWidth = column.maxWidth ?? columnSizes.maxWidth;
    if (entry.width !== undefined) sizing[entry.key] = entry.width;
    const size = entry.width ?? column.width ?? columnSizes.width;
    const region = getRegion(entry.pinned);
    regions[region].push({
      key: entry.key,
      region,
      column,
      width: Math.min(maxWidth, Math.max(minWidth, size)),
      minWidth,
      maxWidth,
    });
  });
  const start = [
    ...leadingColumns.map((leading) => ({
      ...leading,
      region: 'start',
      minWidth: leading.width,
      maxWidth: leading.width,
    })),
    ...regions.start,
  ];
  return buildLayout({
    start,
    center: regions.center,
    end: regions.end,
    sizing,
    viewportWidth,
  });
}

export default computeFallbackLayout;
