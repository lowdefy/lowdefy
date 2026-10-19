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
import Chevron from './Chevron.js';
import getPlainTitle from '../features/filtering/getPlainTitle.js';
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

// A collapsible group's chevron (visibility's handleColumnGroupToggle handles the click). It
// points to the columns it shows: right, to more columns, while collapsed.
function renderToggle({ collapsed, node }) {
  if (node.collapsible !== true) return null;
  const isCollapsed = collapsed.includes(node.key);
  const title = getPlainTitle(node);
  return (
    <button
      aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
      className="lf-table-group-toggle"
      data-collapsed={isCollapsed ? '' : undefined}
      data-lf-column-group-toggle={node.key}
      type="button"
    >
      <Chevron />
    </button>
  );
}

// A group's header keeps its element while its columns change (a collapsible group toggling, a
// column hidden), so a chevron toggled from the keyboard keeps focus: segments of a group are
// keyed by the group and their place among its segments, gaps by their first column.
function getSegmentKey({ first, node, seen }) {
  if (!node) return `~:${first.key}`;
  const count = seen.get(node.key) ?? 0;
  seen.set(node.key, count + 1);
  return `${node.key}:${count}`;
}

function renderSegments({ api, collapsed, cols, level, levels }) {
  const seen = new Map();
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
          key={getSegmentKey({ first, node, seen })}
          role="columnheader"
          style={segmentStyle(segment.cols)}
        >
          {node ? (
            <>
              <HeaderTitle api={api} headerTooltip={node.headerTooltip} title={node.title} />
              {renderToggle({ collapsed, node })}
            </>
          ) : null}
        </div>
      );
    }
  );
}

// One row of header groups (`children` columns) above the leaf headers. Pinned groups stick with
// their columns; centre groups follow column virtualisation (only rendered columns are spanned,
// after the same spacer the leaf row uses). `collapsed` is the collapsed column group keys.
function GroupHeaderRow({ api, centerCols, collapsed, layout, level, levels }) {
  const args = { api, collapsed, level, levels };
  return (
    <div aria-rowindex={level + 1} className="lf-table-row lf-table-group-row" role="row">
      {renderSegments({ ...args, cols: layout.start })}
      <div className="lf-table-center">{renderSegments({ ...args, cols: centerCols })}</div>
      {renderSegments({ ...args, cols: layout.end })}
    </div>
  );
}

export default GroupHeaderRow;
