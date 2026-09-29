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

function renderCells({ cols, summary }) {
  return cols.map((col) => {
    const entry = col.special ? undefined : summary.get(col.key);
    return (
      <div
        className="lf-table-gridcell"
        data-align={col.column?.align}
        data-col-key={col.key}
        data-pinned={col.region === 'center' ? undefined : col.region}
        data-pinned-edge={col.pinnedEdge ? '' : undefined}
        key={col.key}
        role="gridcell"
        style={col.style}
      >
        {entry ? (
          <span className="lf-table-summary" data-aggregate={entry.fn}>
            <span className="lf-table-summary-label">{AGGREGATE_LABELS[entry.fn]}</span>
            <span className="lf-table-summary-value">{entry.text === '' ? '—' : entry.text}</span>
          </span>
        ) : null}
      </div>
    );
  });
}

// The summary footer row (D15: on when a column declares `aggregate`), sticky at the bottom of the
// scroller so it stays in view and scrolls sideways with the columns. Same markup and labels as
// TableLight's summary row.
function SummaryRow({ ariaRowIndex, centerCols, layout, summary }) {
  return (
    <div className="lf-table-footer" role="rowgroup">
      <div aria-rowindex={ariaRowIndex} className="lf-table-row lf-table-summary-row" role="row">
        {renderCells({ cols: layout.start, summary })}
        <div className="lf-table-center">{renderCells({ cols: centerCols, summary })}</div>
        {renderCells({ cols: layout.end, summary })}
      </div>
    </div>
  );
}

export default SummaryRow;
