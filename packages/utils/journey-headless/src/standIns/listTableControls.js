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

import readColumnValue from '@lowdefy/blocks-antd/table/readColumnValue.js';
import resolveControlField from '@lowdefy/blocks-antd/table/resolveControlField.js';
import resolveControlFlag from '@lowdefy/blocks-antd/table/resolveControlFlag.js';
import { type } from '@lowdefy/helpers';

import fireEvent from './fireEvent.js';

// The buttons or menu items a Table cell (blocks-antd table cells ButtonsCell, MenuCell) draws for
// one row: an entry with an eventName, not hidden, its `hidden` and `disabled` resolved as the cell
// resolves them (resolveControlFlag: the compiled `{ when }` condition, else a literal or a
// `*Field` row path).
function resolveControls({ compiled, controls, row, value }) {
  return (type.isArray(controls) ? controls : []).flatMap((control, index) => {
    if (!type.isObject(control) || !type.isString(control.eventName)) {
      return [];
    }
    const conditions = compiled[index];
    const flag = (name) =>
      resolveControlFlag({ control, name, compiled: conditions[name], row, value });
    if (flag('hidden') === true) {
      return [];
    }
    return [
      {
        control,
        index,
        disabled: flag('disabled') === true,
        title: resolveControlField({ control, name: 'title', row }),
      },
    ];
  });
}

// The controls a Table cell draws for one row, with the event and payload the cell sends through
// the Table's onCellEvent: `{ row, rowKey, value, button, buttonIndex }` for a button and
// `{ row, rowKey, value, item, itemIndex }` for a menu item. A menu's trigger comes first, and a
// row whose items are all hidden draws none.
function listTableControls({ actor, block, column, entry }) {
  const { cell, compiled, type: cellType } = column.column;
  const { row, rowKey } = entry;
  const value = readColumnValue({ column: column.column, row });
  if (cellType === 'buttons') {
    return resolveControls({ compiled: compiled.buttons, controls: cell.buttons, row, value }).map(
      ({ control, index, disabled, title }) => ({
        kind: 'button',
        key: control.eventName,
        disabled,
        click: () =>
          fireEvent({
            actor,
            block,
            name: control.eventName,
            event: {
              row,
              rowKey,
              value,
              button: { eventName: control.eventName, title },
              buttonIndex: index,
            },
          }),
      })
    );
  }
  if (cellType === 'menu') {
    const items = resolveControls({ compiled: compiled.items, controls: cell.items, row, value });
    if (items.length === 0) {
      return [];
    }
    return [
      { kind: 'trigger', key: null, disabled: false },
      ...items.map(({ control, index, disabled, title }) => ({
        kind: 'item',
        key: control.eventName,
        disabled,
        click: () =>
          fireEvent({
            actor,
            block,
            name: control.eventName,
            event: {
              row,
              rowKey,
              value,
              item: { eventName: control.eventName, title },
              itemIndex: index,
            },
          }),
      })),
    ];
  }
  return [];
}

export default listTableControls;
