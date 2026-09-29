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

const countFormat = new Intl.NumberFormat();

// Enum-like columns show the group value as the cell does (a tag, a status dot); other types
// show the label text in the column's display format.
const RENDERED_TYPES = new Set(['tag', 'status']);

function ignoreEvent() {}

function renderValue({ api, item, label, level }) {
  if (item.empty || !RENDERED_TYPES.has(level.column.type)) return label;
  const { Renderer } = level;
  // A client group's first row feeds the renderer's row fields; server groups have no rows here.
  const row = api.grouping.tree ? api.grouping.tree.leaves[item.start].original : {};
  return (
    <Renderer
      column={level.column}
      components={api.components}
      methods={api.methods}
      onEvent={ignoreEvent}
      row={row}
      rowKey={api.config.getKey(row)}
      value={item.value}
    />
  );
}

// The chevron, group value and row count. It sits in a zero-width sticky element after the
// leading (checkbox) columns, so the label stays in view while the grid scrolls sideways and
// overlays the cells of the columns without an aggregate.
function GroupLabel({ api, item, label, left, level }) {
  return (
    <div className="lf-table-group-label" style={{ left }}>
      <div className="lf-table-group-label-content" style={{ '--lf-group-depth': item.depth }}>
        <svg aria-hidden="true" className="lf-table-group-toggle" viewBox="0 0 16 16">
          <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="lf-table-group-value">{renderValue({ api, item, label, level })}</span>
        <span className="lf-table-group-count">{countFormat.format(item.count)}</span>
      </div>
    </div>
  );
}

export default GroupLabel;
