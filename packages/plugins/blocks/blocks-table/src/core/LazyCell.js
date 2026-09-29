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

import React, { useRef, useSyncExternalStore } from 'react';
import { get } from '@lowdefy/helpers';
import getCellText from '@lowdefy/blocks-antd/table/getCellText.js';
import renderCell from '@lowdefy/blocks-antd/table/renderCell.js';

import getCellFit from './getCellFit.js';

// The cell's text in the column's cell layout: what a rich cell shows while the grid scrolls
// fast. Buttons hold no text, so theirs is an empty cell.
function renderPlaceholder({ col, original }) {
  const { column } = col;
  const text =
    column.type === 'buttons'
      ? null
      : getCellText({ column, value: get(original, column.field), row: original });
  return <div className={column.compiled.className}>{text}</div>;
}

// A rich cell (lazyCellTypes.js) that mounts on demand. Any rich cell that comes into view while
// the grid scrolls fast shows its text placeholder until the scroll settles, then renders in
// full and stays (D10.4). `buttons` with `showOn: hover` mount only while their row is hovered or
// holds keyboard focus, and not during a fast scroll (tier 1, D4): they are invisible otherwise.
// Chip cells show the chips that fit their column (getCellFit), worked out again when it resizes.
function LazyCell({ api, col, lead, original, rowKey }) {
  const activity = api.cellActivity;
  const rowId = String(rowKey);
  const hoverOnly = col.column.type === 'buttons' && col.column.cell.showOn === 'hover';
  const shownRef = useRef(false);
  const active = useSyncExternalStore(activity.subscribe, () => {
    const { state } = activity;
    if (hoverOnly) {
      // Rows pass under a still pointer while the grid scrolls: wait until it settles.
      if (state.fastScrolling) return false;
      return activity.noHover || state.hoveredRow === rowId || state.focusedRow === rowId;
    }
    return shownRef.current || !state.fastScrolling;
  });
  if (!active) return renderPlaceholder({ col, original });
  shownRef.current = true;
  return renderCell({
    column: col.column,
    row: original,
    rowKey,
    methods: api.methods,
    components: api.components,
    onEvent: api.onCellEvent,
    fit: getCellFit({ api, col, lead }),
  });
}

export default LazyCell;
