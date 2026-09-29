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

import React from 'react';

import GroupHeaderRow from './GroupHeaderRow.js';
import HeaderCell from './HeaderCell.js';

function renderHeaderCells({ api, cols, activeCol, state }) {
  return cols.map((col) => (
    <HeaderCell api={api} col={col} focused={activeCol === col.index} key={col.key} state={state} />
  ));
}

function renderGroupRows({ api, centerCols, layout, levels }) {
  const groupRows = [];
  for (let level = 0; level < levels.depth; level++) {
    groupRows.push(
      <GroupHeaderRow
        api={api}
        centerCols={centerCols}
        key={level}
        layout={layout}
        level={level}
        levels={levels}
      />
    );
  }
  return groupRows;
}

function HeaderRow({
  activeCol,
  api,
  centerCols,
  className,
  layout,
  levels,
  state,
  sticky,
  style,
}) {
  return (
    <div
      className={className}
      data-sticky={sticky ? undefined : 'false'}
      role="rowgroup"
      style={style}
    >
      {renderGroupRows({ api, centerCols, layout, levels })}
      <div aria-rowindex={levels.depth + 1} className="lf-table-row" data-row-index={-1} role="row">
        {renderHeaderCells({ api, cols: layout.start, activeCol, state })}
        <div className="lf-table-center">
          {renderHeaderCells({ api, cols: centerCols, activeCol, state })}
        </div>
        {renderHeaderCells({ api, cols: layout.end, activeCol, state })}
      </div>
    </div>
  );
}

export default HeaderRow;
