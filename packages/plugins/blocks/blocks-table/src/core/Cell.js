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

import React, { memo, useCallback } from 'react';

// One grid cell. Memoised on the row object and the layout column, so a horizontal range change
// only mounts the cells that came into range. Tier-0 cells render plain DOM (D4).
function Cell({ api, col, focused, lead, original, selected }) {
  const onEvent = useCallback(
    ({ name, event }) => api.actions.onCellEvent({ name, event, original, column: col.column }),
    [api, original, col]
  );
  if (col.special) {
    return (
      <div
        aria-colindex={col.ariaIndex}
        className="lf-table-cell lf-table-select"
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
  const { Renderer } = col;
  return (
    <div
      aria-colindex={col.ariaIndex}
      className="lf-table-cell"
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
      <span className="lf-table-cell-content">
        <Renderer
          column={col.column}
          components={api.components}
          methods={api.methods}
          onEvent={onEvent}
          row={original}
          rowKey={api.config.getKey(original)}
          value={col.accessor(original)}
        />
      </span>
    </div>
  );
}

export default memo(Cell);
