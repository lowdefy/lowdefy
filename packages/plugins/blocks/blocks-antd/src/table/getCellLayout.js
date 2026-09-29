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

import { type } from '@lowdefy/helpers';

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';

// The class and style of a column's cell wrapper, fixed per column so cells
// share them: text layout (single line, wrap or line clamp) and alignment.
function getCellLayout(column) {
  const classes = ['lf-table-cell'];
  let style;
  if (CELL_TYPE_FAMILIES[column.type] === 'action') {
    classes.push('lf-table-cell-actions');
  } else if (type.isInt(column.ellipsis)) {
    classes.push('lf-table-cell-clamp');
    style = { '--lf-table-clamp': column.ellipsis };
  } else if (column.wrap) {
    classes.push('lf-table-cell-wrap');
  } else {
    classes.push('lf-table-cell-nowrap');
  }
  if (column.align === 'center' || column.align === 'end') {
    classes.push(`lf-table-cell-align-${column.align}`);
  }
  return { className: classes.join(' '), style };
}

export default getCellLayout;
