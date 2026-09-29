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

import React, { memo, useContext } from 'react';
import { cn } from '@lowdefy/block-utils';

import Cell from './Cell.js';
import cellLeads from './cellLeads.js';
import RenderProbeContext from './RenderProbeContext.js';

function renderCells({ api, cols, activeCol, lead, leadIndex, original, selected }) {
  return cols.map((col) => (
    <Cell
      api={api}
      col={col}
      focused={activeCol === col.index}
      key={col.key}
      lead={col.index === leadIndex ? lead : undefined}
      original={original}
      selected={selected}
    />
  ));
}

// Wrapped row items (tree rows, expandable rows) get the features' lead elements in their first
// data cell; plain rows render none.
function renderLead({ api, item }) {
  if (!item) return undefined;
  return cellLeads.map((Lead, index) => <Lead api={api} item={item} key={index} />);
}

// Memoised by row key and row object: with data diffed by key, an update to one row of 100k
// re-renders that one row. Rows never receive their TanStack row object, whose identity changes
// whenever the row model rebuilds. `rowRules` classes and styles come from the row object, so they
// are worked out here, inside the memo. The row element carries `lf-table-row`, the class the
// shared cell styles reveal `showOn: hover` buttons from (the row holds its pinned cells too, so
// CSS hover covers the whole row). Rows added in the browser and still saving (enrichment's
// optimistic new rows, `api.savingRows`) carry `data-saving`.
function Row({
  activeCol,
  api,
  ariaRowIndex,
  centerCols,
  className,
  displayIndex,
  endCols,
  item,
  leadIndex,
  measured,
  offset,
  original,
  rowId,
  selectable,
  selected,
  startCols,
  style,
}) {
  const probe = useContext(RenderProbeContext);
  probe?.row(rowId);
  const positioned = offset !== undefined;
  const lead = renderLead({ api, item });
  const cellArgs = { api, activeCol, lead, leadIndex, original, selected };
  const ruled = api.config.rowRules === null ? null : api.config.rowRules(original);
  let rowStyle = style;
  if (ruled?.style) rowStyle = { ...(style ?? {}), ...ruled.style };
  if (positioned) rowStyle = { ...(rowStyle ?? {}), transform: `translateY(${offset}px)` };
  return (
    <div
      aria-expanded={
        item?.hasChildren || item?.expandable
          ? item.expanded === true || item.detailExpanded === true
          : undefined
      }
      aria-level={item?.depth === undefined ? undefined : item.depth + 1}
      aria-rowindex={ariaRowIndex}
      aria-selected={selectable ? selected : undefined}
      className={cn(className, ruled?.className)}
      data-measure-key={measured ? rowId : undefined}
      data-measured={measured ? '' : undefined}
      data-positioned={positioned ? '' : undefined}
      data-row-index={displayIndex}
      data-row-key={rowId}
      data-saving={api.savingRows?.has(original) ? '' : undefined}
      role="row"
      style={rowStyle}
    >
      {renderCells({ ...cellArgs, cols: startCols })}
      <div className="lf-table-center">{renderCells({ ...cellArgs, cols: centerCols })}</div>
      {renderCells({ ...cellArgs, cols: endCols })}
    </div>
  );
}

export default memo(Row);
