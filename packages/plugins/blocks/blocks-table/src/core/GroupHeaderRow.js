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

import buildGroupSegments from './buildGroupSegments.js';
import HeaderTitle from './HeaderTitle.js';

function segmentStyle(cols) {
  const first = cols[0];
  const last = cols[cols.length - 1];
  const widths = cols.map((col) => `var(--lf-w${col.index})`);
  // Widths are the columns' own CSS variables, so a resize drag moves the group edges too.
  const style = { width: widths.length === 1 ? widths[0] : `calc(${widths.join(' + ')})` };
  if (first.region === 'start') style.left = `var(--lf-l${first.index})`;
  if (last.region === 'end') style.right = `var(--lf-r${last.index})`;
  return style;
}

function renderSegments({ api, cols, level, levels }) {
  return buildGroupSegments({ cols, level, ancestorsByKey: levels.ancestorsByKey }).map(
    (segment) => {
      const first = segment.cols[0];
      const { node } = segment;
      return (
        <div
          aria-colindex={first.ariaIndex}
          aria-colspan={segment.cols.length}
          className="lf-table-gridcell lf-table-group-header"
          data-group={node ? node.key : undefined}
          data-pinned={first.region === 'center' ? undefined : first.region}
          key={`${node ? node.key : '~'}:${first.key}`}
          role="columnheader"
          style={segmentStyle(segment.cols)}
        >
          {node ? (
            <HeaderTitle api={api} headerTooltip={node.headerTooltip} title={node.title} />
          ) : null}
        </div>
      );
    }
  );
}

// One row of header groups (`children` columns) above the leaf headers. Pinned groups stick with
// their columns; centre groups follow column virtualisation (only rendered columns are spanned,
// after the same spacer the leaf row uses).
function GroupHeaderRow({ api, centerCols, layout, level, levels }) {
  return (
    <div aria-rowindex={level + 1} className="lf-table-row lf-table-group-row" role="row">
      {renderSegments({ api, cols: layout.start, level, levels })}
      <div className="lf-table-center">
        {renderSegments({ api, cols: centerCols, level, levels })}
      </div>
      {renderSegments({ api, cols: layout.end, level, levels })}
    </div>
  );
}

export default GroupHeaderRow;
