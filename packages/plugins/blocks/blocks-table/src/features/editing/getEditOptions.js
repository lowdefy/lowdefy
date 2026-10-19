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

function getPositionField(rowDrag) {
  if (!type.isObject(rowDrag)) return null;
  return type.isString(rowDrag.positionField) ? rowDrag.positionField : null;
}

// The row-level editing options. Row drag works on both blocks (Table saves a move through
// onRowMove, TableInput records it in its changeset); adding and deleting rows is TableInput's.
function getEditOptions({ input, properties }) {
  const rowDrag = properties.rowDrag === true || type.isObject(properties.rowDrag);
  return {
    addRow: Boolean(input) && properties.addRow === true,
    addRowText: type.isString(properties.addRowText) ? properties.addRowText : null,
    deleteButton: Boolean(input) && properties.rowActions?.delete === true,
    deleteRows: Boolean(input) && properties.deleteRows === true,
    positionField: rowDrag ? getPositionField(properties.rowDrag) : null,
    rowDrag,
  };
}

export default getEditOptions;
