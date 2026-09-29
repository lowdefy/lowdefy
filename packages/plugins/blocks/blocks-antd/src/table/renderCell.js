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
import { get, type } from '@lowdefy/helpers';

import getCellRenderer from './getCellRenderer.js';
import getCellText from './getCellText.js';
import './tableCells.css';

// One cell's content: the type's renderer inside a wrapper that carries the
// column's layout (single line, wrap or line clamp, alignment), the matching
// `rules` class and style, and the tooltip as a native title. A line-clamped
// cell without a tooltip shows its full text on hover. `column` must come
// from compileColumns. Returns an element for the host's own cell element
// (a td, or a grid cell div). `fit` (optional, `{ width, measure }`) is the
// content width of a fixed-width single-line cell and the host's chip
// measurer: `tag` / `tags` cells then show only the chips that fit whole.
function renderCell({ column, row, rowKey, methods, components, onEvent, fit }) {
  const value = get(row, column.field);
  const { compiled } = column;
  const ruled = compiled.rules === null ? null : compiled.rules(row, value);
  let title = compiled.tooltip === null ? undefined : compiled.tooltip(row, value);
  if (type.isUndefined(title) && type.isInt(column.ellipsis)) {
    title = getCellText({ column, value, row }) || undefined;
  }
  let { className, style } = compiled;
  if (ruled !== null) {
    if (type.isString(ruled.className)) className = `${className} ${ruled.className}`;
    if (!type.isUndefined(ruled.style)) style = { ...(style ?? {}), ...ruled.style };
  }
  const Renderer = getCellRenderer(column.type);
  return (
    <div className={className} style={style} title={title}>
      <Renderer
        value={value}
        row={row}
        rowKey={rowKey}
        column={column}
        methods={methods}
        components={components}
        onEvent={onEvent}
        fit={fit}
      />
    </div>
  );
}

export default renderCell;
