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
import { nunjucksFunction } from '@lowdefy/nunjucks';

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';
import compileCondition from './compileCondition.js';
import compileRules from './compileRules.js';
import compileTooltip from './compileTooltip.js';

// `hidden` and `disabled` on a button or menu item take a boolean, or
// `{ when: Condition }` tested against the row and the cell value.
function compileWhen({ option, columnsByKey, column, user, now }) {
  if (!type.isObject(option)) return null;
  return compileCondition({ condition: option.when, columnsByKey, column, user, now });
}

function compileControls({ controls, columnsByKey, column, user, now }) {
  if (!type.isArray(controls)) return [];
  return controls.map((control) => ({
    hidden: compileWhen({ option: control?.hidden, columnsByKey, column, user, now }),
    disabled: compileWhen({ option: control?.disabled, columnsByKey, column, user, now }),
  }));
}

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

// Adds `compiled` to each normalised column: everything a cell would otherwise
// work out per render, done once per column config. `rules` and `tooltip` are
// functions (or null), `template` is the html cell's compiled template,
// `buttons` / `items` hold the compiled `when` conditions of each button or
// menu item, by index, and `className` / `style` are the cell wrapper's. Hosts call this after normalizeColumns and pass the
// compiled columns to renderCell.
function compileColumns({ columns, columnsByKey, user, now }) {
  return columns.map((column) => {
    const { cell } = column;
    const layout = getCellLayout(column);
    return {
      ...column,
      compiled: {
        className: layout.className,
        style: layout.style,
        rules: compileRules({ rules: column.rules, columnsByKey, column, user, now }),
        tooltip: compileTooltip({ tooltip: column.tooltip }),
        template:
          column.type === 'html' && type.isString(cell.template)
            ? nunjucksFunction(cell.template)
            : null,
        buttons:
          column.type === 'buttons'
            ? compileControls({ controls: cell.buttons, columnsByKey, column, user, now })
            : [],
        items:
          column.type === 'menu'
            ? compileControls({ controls: cell.items, columnsByKey, column, user, now })
            : [],
      },
    };
  });
}

export default compileColumns;
