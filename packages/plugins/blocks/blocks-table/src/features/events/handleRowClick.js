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

import { get } from '@lowdefy/helpers';
import isControlTarget from '@lowdefy/blocks-antd/table/isControlTarget.js';

import getBodyTarget from './getBodyTarget.js';
import isTextDrag from './isTextDrag.js';

function handleRowClick(event, api) {
  const target = getBodyTarget({ event, api });
  if (!target) return false;
  const { cell, row, rowElement } = target;
  if (isControlTarget({ target: event.target, container: rowElement })) return false;
  if (isTextDrag({ event, api })) return true;
  if (cell && api.events.onCellClick) {
    const col = api.layout.byKey.get(cell.dataset.colKey);
    if (col && !col.special) {
      api.methods.triggerEvent({
        name: 'onCellClick',
        event: {
          row: row.original,
          rowKey: api.config.getKey(row.original),
          column: { key: col.key, field: col.column.field },
          value: get(row.original, col.column.field),
        },
      });
    }
  }
  api.actions.activateRow({ id: row.id, event });
  return true;
}

export default handleRowClick;
