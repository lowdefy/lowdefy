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

import { get, set, type } from '@lowdefy/helpers';

import fireEvent from './fireEvent.js';

// A button's or menu item's key with a row-path twin (`hidden` / `hiddenField`): the path, read
// from the row, wins when it is set (blocks-aggrid cellRenderers).
function resolveField({ control, name, row }) {
  const fieldKey = `${name}Field`;
  if (type.isString(control[fieldKey])) {
    return get(row, control[fieldKey]);
  }
  return control[name];
}

function listButtons({ actor, block, cell, row, value }) {
  return (type.isArray(cell.buttons) ? cell.buttons : []).flatMap((button, index) => {
    if (!type.isObject(button) || !type.isString(button.eventName)) {
      return [];
    }
    if (resolveField({ control: button, name: 'hidden', row }) === true) {
      return [];
    }
    const title = resolveField({ control: button, name: 'title', row });
    return [
      {
        kind: 'button',
        key: button.eventName,
        disabled: resolveField({ control: button, name: 'disabled', row }) === true,
        click: () =>
          fireEvent({
            actor,
            block,
            name: button.eventName,
            event: {
              row,
              value,
              button: { eventName: button.eventName, title },
              buttonIndex: index,
            },
          }),
      },
    ];
  });
}

// Hidden items are dropped, so a row whose items are all hidden draws no trigger.
function listMenu({ actor, block, cell, row, value }) {
  const items = (type.isArray(cell.items) ? cell.items : []).flatMap((item, index) => {
    if (!type.isObject(item) || !type.isString(item.eventName)) {
      return [];
    }
    if (resolveField({ control: item, name: 'hidden', row }) === true) {
      return [];
    }
    const title = resolveField({ control: item, name: 'title', row });
    return [
      {
        kind: 'item',
        key: item.eventName,
        disabled: resolveField({ control: item, name: 'disabled', row }) === true,
        click: () =>
          fireEvent({
            actor,
            block,
            name: item.eventName,
            event: { row, value, item: { eventName: item.eventName, title }, itemIndex: index },
          }),
      },
    ];
  });
  if (items.length === 0) {
    return [];
  }
  return [{ kind: 'trigger', key: null, disabled: false }, ...items];
}

// The switch writes its new value into the row (node.setDataValue on the column's field) before
// its event, so the event's row holds it, and so does the stand-in's held row for a later click.
function listSwitch({ actor, block, cell, colDef, row, value }) {
  return [
    {
      kind: 'switch',
      key: cell.eventName,
      disabled: cell.disabled === true,
      click: () => {
        const newValue = !value;
        if (type.isString(colDef.field)) {
          set(row, colDef.field, newValue);
        }
        if (type.isString(cell.eventName)) {
          fireEvent({ actor, block, name: cell.eventName, event: { row, value, newValue } });
        }
      },
    },
  ];
}

const LISTS = { buttons: listButtons, menu: listMenu, switch: listSwitch };

// The controls an AgGrid cell renderer (blocks-aggrid cellRenderers ButtonsCell, MenuCell,
// SwitchCell) draws for one row, as the stand-in clicks them: each with the event the renderer
// fires, its payload and whether it is disabled. Only a boolean `disabled` from a row path counts,
// as the renderer passes nothing else to antd.
function listAgGridControls({ actor, block, column, entry }) {
  const { colDef } = column;
  const cell = colDef.cell;
  const list = type.isObject(cell) ? LISTS[cell.type] : undefined;
  if (type.isUndefined(list)) {
    return [];
  }
  const value = type.isString(colDef.field) ? get(entry.row, colDef.field) : undefined;
  return list({ actor, block, cell, colDef, row: entry.row, value });
}

export default listAgGridControls;
