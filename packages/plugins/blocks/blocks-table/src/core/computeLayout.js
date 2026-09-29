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

import distributeFlex from './distributeFlex.js';
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
// the view's wrap.
function computeLayout({ table, leadingColumns, viewportWidth, widths, wrap = false }) {
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
  const end = table
    .getEndVisibleLeafColumns()
    .map((column) => fromTanstackColumn({ column, region: 'end', widths, wrap }));
  const cols = [...start, ...center, ...end];
  const sizing = { ...table.atoms.columnSizing.get(), ...widths };
  distributeFlex({ cols, viewportWidth, sizing });

  const vars = {};
  const byKey = new Map();
  let startWidth = 0;
  start.forEach((col) => {
    col.left = startWidth;
    startWidth += col.width;
  });
  let endWidth = 0;
  for (let i = end.length - 1; i >= 0; i--) {
    end[i].right = endWidth;
    endWidth += end[i].width;
  }
  const centerStarts = new Float64Array(center.length);
  const centerEnds = new Float64Array(center.length);
  let centerWidth = 0;
  center.forEach((col, i) => {
    col.centerStart = centerWidth;
    centerStarts[i] = centerWidth;
    centerWidth += col.width;
    centerEnds[i] = centerWidth;
  });

  cols.forEach((col, index) => {
    col.index = index;
    col.ariaIndex = index + 1;
    vars[`--lf-w${index}`] = `${col.width}px`;
    const style = { width: `var(--lf-w${index})` };
    if (col.region === 'start') {
      vars[`--lf-l${index}`] = `${col.left}px`;
      style.left = `var(--lf-l${index})`;
    }
    if (col.region === 'end') {
      vars[`--lf-r${index}`] = `${col.right}px`;
      style.right = `var(--lf-r${index})`;
    }
    col.style = style;
    byKey.set(col.key, col);
  });
  if (start.length) start[start.length - 1].pinnedEdge = true;
  if (end.length) end[0].pinnedEdge = true;

  const totalWidth = startWidth + centerWidth + endWidth;
  vars['--lf-total'] = `${totalWidth}px`;
  vars['--lf-center-w'] = `${centerWidth}px`;
  return {
    byKey,
    center,
    centerEnds,
    centerStarts,
    centerWidth,
    cols,
    end,
    endWidth,
    start,
    startWidth,
    totalWidth,
    vars,
  };
}

export default computeLayout;
