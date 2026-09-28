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

import addChangeRow from './addChangeRow.js';
import createNewRow from './createNewRow.js';
import generateRowKey from './generateRowKey.js';
import positionBetween, { POSITION_STEP } from './positionBetween.js';

// With a position field, an added row goes after the last row shown.
function nextPosition({ api, positionField }) {
  const last = api.rows[api.rows.length - 1]?.original;
  if (last === undefined) return positionBetween();
  return positionBetween({ before: get(last, positionField) }) ?? POSITION_STEP;
}

// "+ Add row": adds `{ rowKey, ...defaults }` to the changeset, then opens the editor on the new
// row's first editable cell once it renders (the layer resolves `pendingStart` after the write).
function createAddRow(api) {
  return function addRow() {
    const { editing } = api;
    const { positionField } = editing.options;
    const { rowKey, fields } = createNewRow({
      specs: editing.specs,
      keyField: editing.keyField,
      generateKey: generateRowKey,
    });
    if (positionField && type.isNone(get(fields, positionField))) {
      set(fields, positionField, nextPosition({ api, positionField }));
    }
    const firstEditable = api.layout.cols.find(
      (col) => !col.special && editing.specs.get(col.key)?.editable
    );
    api.actions.cancelEdit({ refocus: false });
    const changes = addChangeRow({ changes: editing.changes, rowKey, fields });
    const written = api.actions.writeChanges({ changes, cause: 'add', rowKey });
    if (written && firstEditable) {
      editing.pendingStart = { rowId: String(rowKey), colKey: firstEditable.key };
    }
    return written;
  };
}

export default createAddRow;
