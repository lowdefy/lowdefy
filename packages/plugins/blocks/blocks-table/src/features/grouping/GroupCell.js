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
import AGGREGATE_LABELS from '@lowdefy/blocks-antd/table/aggregateLabels.js';
import getAggregateText from '@lowdefy/blocks-antd/table/getAggregateText.js';

import GroupCheckbox from './GroupCheckbox.js';

function renderContent({ api, col, item, selectionCount }) {
  if (col.special === 'select') {
    if (!selectionCount) return null;
    return <GroupCheckbox selected={selectionCount.selected} total={selectionCount.total} />;
  }
  if (col.special) return null;
  const fn = api.grouping.aggregateFns.get(col.key);
  if (!fn) return null;
  const text = getAggregateText({ fn, value: item.aggregates[col.key], column: col.column });
  return (
    <span className="lf-table-group-aggregate" data-aggregate={fn}>
      <span className="lf-table-group-aggregate-fn">{AGGREGATE_LABELS[fn]}</span>
      <span className="lf-table-group-aggregate-value">{text}</span>
    </span>
  );
}

// One cell of a group header row, on the same layout column as the data cells below it, so the
// group's aggregates line up under their columns and keyboard navigation crosses group rows like
// any other. In the sticky overlay (a copy of a real row) the cells are not focus targets.
function GroupCell({ api, col, focused, item, overlay, selectionCount }) {
  const selectCell = col.special === 'select' && Boolean(selectionCount);
  let tabIndex;
  if (!overlay) tabIndex = focused ? 0 : -1;
  return (
    <div
      aria-colindex={overlay ? undefined : col.ariaIndex}
      className={col.special ? 'lf-table-gridcell lf-table-select' : 'lf-table-gridcell'}
      data-align={col.column?.align}
      data-col-index={col.index}
      data-col-key={col.key}
      data-focused={focused ? '' : undefined}
      data-lf-cell={overlay ? undefined : ''}
      data-lf-group-select={selectCell ? '' : undefined}
      data-pinned={col.region === 'center' ? undefined : col.region}
      data-pinned-edge={col.pinnedEdge ? '' : undefined}
      role={overlay ? undefined : 'gridcell'}
      style={col.style}
      tabIndex={tabIndex}
    >
      {renderContent({ api, col, item, selectionCount })}
    </div>
  );
}

export default GroupCell;
