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

import React, { memo } from 'react';
import renderCell from '@lowdefy/blocks-antd/table/renderCell.js';

import LAZY_CELL_TYPES from './lazyCellTypes.js';
import LazyCell from './LazyCell.js';

function renderContent({ api, col, lead, original }) {
  const rowKey = api.config.getKey(original);
  if (LAZY_CELL_TYPES.has(col.column.type)) {
    return <LazyCell api={api} col={col} lead={lead} original={original} rowKey={rowKey} />;
  }
  return renderCell({
    column: col.column,
    row: original,
    rowKey,
    methods: api.methods,
    components: api.components,
    onEvent: api.onCellEvent,
  });
}

// One grid cell. Memoised on the row object and the layout column, so a horizontal range change
// only mounts the cells that came into range. The content is the shared column core's cell
// (`renderCell`, the same renderers TableLight uses); renderers build their own event payloads
// and `api.onCellEvent` passes them to the block's triggerEvent. Rich cell types mount on demand
// through LazyCell (placeholders during fast scrolls, hover-only buttons on hover). `lead` (the
// tree indent and chevron, the expand chevron) goes before the content in a row's first data
// cell.
function Cell({ api, col, focused, lead, original, selected }) {
  if (col.special) {
    return (
      <div
        aria-colindex={col.ariaIndex}
        className="lf-table-gridcell lf-table-select"
        data-col-index={col.index}
        data-col-key={col.key}
        data-focused={focused ? '' : undefined}
        data-lf-cell=""
        data-lf-select-cell=""
        data-pinned={col.region === 'center' ? undefined : col.region}
        data-pinned-edge={col.pinnedEdge ? '' : undefined}
        role="gridcell"
        style={col.style}
        tabIndex={focused ? 0 : -1}
      >
        <col.Cell api={api} selected={selected} />
      </div>
    );
  }
  return (
    <div
      aria-colindex={col.ariaIndex}
      className="lf-table-gridcell"
      data-align={col.column.align}
      data-col-index={col.index}
      data-col-key={col.key}
      data-focused={focused ? '' : undefined}
      data-lf-cell=""
      data-pinned={col.region === 'center' ? undefined : col.region}
      data-pinned-edge={col.pinnedEdge ? '' : undefined}
      role="gridcell"
      style={col.style}
      tabIndex={focused ? 0 : -1}
    >
      {lead}
      {renderContent({ api, col, lead, original })}
    </div>
  );
}

export default memo(Cell);
