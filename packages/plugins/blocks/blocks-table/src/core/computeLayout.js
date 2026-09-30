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
import getViewWrapColumn from '../features/density/getViewWrapColumn.js';

function fromTanstackColumn({ column, region, widths, wrap }) {
  const { meta } = column.columnDef;
  return {
    key: column.id,
    region,
    column: wrap ? getViewWrapColumn(meta.column) : meta.column,
    accessor: meta.accessor,
    width: widths?.[column.id] ?? column.getSize(),
    minWidth: column.columnDef.minSize,
    maxWidth: column.columnDef.maxSize,
  };
}

// The column geometry every row shares: visual order (start-pinned, centre, end-pinned), widths,
// sticky offsets, centre prefix offsets for column virtualisation, and the CSS variables that
// carry widths and offsets. `widths` overrides column sizes (a resize drag in progress); `wrap` is
// the view's wrap. Leading special columns go first in the start region, trailing ones last in
// the end region.
function computeLayout({
  table,
  leadingColumns,
  trailingColumns = [],
  viewportWidth,
  widths,
  wrap = false,
}) {
  const start = [
    ...leadingColumns.map((leading) => ({
      ...leading,
      region: 'start',
      minWidth: leading.width,
      maxWidth: leading.width,
    })),
    ...table
      .getStartVisibleLeafColumns()
      .map((column) => fromTanstackColumn({ column, region: 'start', widths, wrap })),
  ];
  const center = table
    .getCenterVisibleLeafColumns()
    .map((column) => fromTanstackColumn({ column, region: 'center', widths, wrap }));
  const end = [
    ...table
      .getEndVisibleLeafColumns()
      .map((column) => fromTanstackColumn({ column, region: 'end', widths, wrap })),
    ...trailingColumns.map((trailing) => ({
      ...trailing,
      region: 'end',
      minWidth: trailing.width,
      maxWidth: trailing.width,
    })),
  ];
  const sizing = { ...table.atoms.columnSizing.get(), ...widths };
  return buildLayout({ start, center, end, sizing, viewportWidth });
}

export default computeLayout;
