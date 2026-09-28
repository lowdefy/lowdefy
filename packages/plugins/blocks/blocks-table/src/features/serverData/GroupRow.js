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
import { cn } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Chevron from '../../core/Chevron.js';
import stripHtml from '../export/stripHtml.js';

const INDENT = 20;

function formatValue(value) {
  if (type.isNone(value) || value === '') return '(empty)';
  if (type.isNumber(value)) return value.toLocaleString();
  return String(value);
}

// A minimal header row for server groups: chevron, column title and group value, count and the
// group's aggregates. The grouping feature's group row renderer (same `kind: 'group'` items)
// replaces it once both are merged.
function GroupRow({ api, className, displayIndex, item }) {
  const column = api.config.columnsByKey.get(item.column);
  const aggregates = Object.entries(item.aggregates ?? {});
  return (
    <div
      aria-expanded={item.expanded}
      aria-level={item.depth + 1}
      aria-rowindex={displayIndex + 2}
      className={cn(className, 'lf-table-group-row')}
      data-group-key={item.key}
      data-lf-group-row=""
      data-row-index={displayIndex}
      role="row"
    >
      <div
        aria-colspan={api.layout.cols.length}
        className="lf-table-cell lf-table-group-cell"
        data-col-index="0"
        data-lf-cell=""
        role="gridcell"
        tabIndex={-1}
      >
        <span className="lf-table-tree-indent" style={{ width: item.depth * INDENT }} />
        <span className="lf-table-toggle" data-expanded={item.expanded ? '' : undefined}>
          <Chevron />
        </span>
        <span className="lf-table-group-title">
          {stripHtml(column?.title ?? item.column)}: <strong>{formatValue(item.value)}</strong>
        </span>
        <span className="lf-table-group-count">{formatValue(item.count)}</span>
        {aggregates.map(([key, value]) => (
          <span className="lf-table-group-aggregate" data-aggregate={key} key={key}>
            {stripHtml(api.config.columnsByKey.get(key)?.title ?? key)}: {formatValue(value)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default memo(GroupRow);
