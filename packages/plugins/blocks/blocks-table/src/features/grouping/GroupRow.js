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

import React, { memo, useMemo } from 'react';

import countGroupSelection from './countGroupSelection.js';
import getGroupLabel from './getGroupLabel.js';
import GroupCell from './GroupCell.js';
import GroupLabel from './GroupLabel.js';
import './grouping.css';

function renderCells({ activeCol, api, cols, item, overlay, selectionCount }) {
  return cols.map((col) => (
    <GroupCell
      api={api}
      col={col}
      focused={activeCol === col.index}
      item={item}
      key={col.key}
      overlay={overlay}
      selectionCount={selectionCount}
    />
  ));
}

// A group header item of the flat row list (the `group` row renderer). Same row element, height
// and cell layout as a data row; it carries `data-group-key` and no `data-row-key`, so row
// events, rowLink and row selection ignore it. `overlay` renders the sticky copy.
function GroupRow({
  activeCol,
  api,
  centerCols,
  className,
  displayIndex,
  endCols,
  item,
  offset,
  overlay = false,
  selectable,
  selection,
  startCols,
  style,
}) {
  const { grouping } = api;
  const level = grouping.levels[item.depth];
  const checkbox = selectable && api.config.rowSelection.type === 'checkbox';
  const selectionCount = useMemo(
    () =>
      checkbox
        ? countGroupSelection({
            leaves: grouping.tree.leaves,
            start: item.start,
            end: item.end,
            selection,
          })
        : null,
    [checkbox, item, selection]
  );
  const label = getGroupLabel({ level, item });
  const leading = startCols.filter((col) => col.special);
  const pinned = startCols.filter((col) => !col.special);
  const labelLeft = leading.reduce((width, col) => width + col.width, 0);
  const positioned = offset !== undefined;
  const cellArgs = { activeCol, api, item, overlay, selectionCount };
  return (
    <div
      aria-expanded={!item.collapsed}
      aria-rowindex={overlay ? undefined : displayIndex + 2}
      className={`${className} lf-table-group-row`}
      data-group-depth={item.depth}
      data-group-index={displayIndex}
      data-group-key={item.key}
      data-group-label={label}
      data-positioned={positioned ? '' : undefined}
      data-row-index={overlay ? undefined : displayIndex}
      role={overlay ? undefined : 'row'}
      style={positioned ? { ...style, transform: `translateY(${offset}px)` } : style}
    >
      {renderCells({ ...cellArgs, cols: leading })}
      <GroupLabel api={api} item={item} label={label} left={labelLeft} level={level} />
      {renderCells({ ...cellArgs, cols: pinned })}
      <div className="lf-table-center">{renderCells({ ...cellArgs, cols: centerCols })}</div>
      {renderCells({ ...cellArgs, cols: endCols })}
    </div>
  );
}

export default memo(GroupRow);
