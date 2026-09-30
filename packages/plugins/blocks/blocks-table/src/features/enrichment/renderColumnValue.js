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
import renderCell from '@lowdefy/blocks-antd/table/renderCell.js';

import LAZY_CELL_TYPES from '../../core/lazyCellTypes.js';
import LazyCell from '../../core/LazyCell.js';

// A computed cell's value through its column's type, as the core Cell renders a column no
// feature takes over: rich types through LazyCell, the rest through the shared cell core.
function renderColumnValue({ api, col, lead, original, rowKey }) {
  if (LAZY_CELL_TYPES.has(col.column.type)) {
    return <LazyCell api={api} col={col} lead={lead} original={original} rowKey={rowKey} />;
  }
  return renderCell({
    column: col.column,
    row: original,
    rowKey,
    methods: api.methods,
    components: api.components,
    onEvent: api.onCellEvent,
  });
}

export default renderColumnValue;
