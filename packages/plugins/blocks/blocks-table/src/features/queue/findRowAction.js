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

import { get, type } from '@lowdefy/helpers';
import resolveControlField from '@lowdefy/blocks-antd/table/resolveControlField.js';
import resolveControlFlag from '@lowdefy/blocks-antd/table/resolveControlFlag.js';

const CONTROL_LISTS = { buttons: 'buttons', menu: 'items' };

// The row button or menu item bound to a key (`key: 'a'`), resolved for one row: the first one
// in column order that is shown and enabled for that row, with the event payload its click would
// fire (D5).
function findRowAction({ columns, key, row, rowKey }) {
  for (const column of columns) {
    const listName = CONTROL_LISTS[column.type];
    if (!listName) continue;
    const controls = column.cell[listName];
    if (!type.isArray(controls)) continue;
    const value = get(row, column.field);
    for (let index = 0; index < controls.length; index++) {
      const control = controls[index];
      if (!type.isObject(control) || control.key !== key || !type.isString(control.eventName)) {
        continue;
      }
      // `{ when }` flags are compiled with the columns (compileColumns); literal and `*Field`
      // flags resolve without it.
      const compiled = column.compiled?.[listName]?.[index] ?? {};
      const flag = (name) =>
        resolveControlFlag({ control, name, compiled: compiled[name], row, value });
      if (flag('hidden') === true || flag('disabled') === true) continue;
      const described = {
        eventName: control.eventName,
        title: resolveControlField({ control, name: 'title', row }),
      };
      const event =
        listName === 'buttons'
          ? { row, rowKey, value, button: described, buttonIndex: index }
          : { row, rowKey, value, item: described, itemIndex: index };
      return { name: control.eventName, event };
    }
  }
  return null;
}

export default findRowAction;
