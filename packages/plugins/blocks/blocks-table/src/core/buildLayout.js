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

// The column geometry from the columns of each region, in visual order (`{ key, region, column,
// width, minWidth, maxWidth }`, plus `special` for leading columns): flex widths, sticky offsets,
// centre prefix offsets for column virtualisation, and the CSS variables that carry widths and
// offsets. `sizing` holds the widths the user set (a flex column the user resized stays put).
// The engine builds the columns from TanStack (computeLayout); the lazy block's fallback builds
// them from the column config, so both lay the columns out the same way.
function buildLayout({ start, center, end, sizing, viewportWidth }) {
  const cols = [...start, ...center, ...end];
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

export default buildLayout;
