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

import isControlTarget from '@lowdefy/blocks-antd/table/isControlTarget.js';

// Double-click on an editable cell opens its editor; the double-click is the edit's, not
// onRowDoubleClick's. Double-clicks inside an open editor (selecting a word) stay the editor's.
function handleEditDoubleClick(event, api) {
  if (!api.editing?.enabled) return false;
  if (event.target.closest('[data-lf-editor]')) return true;
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || !api.contains(cell) || cell.dataset.special) return false;
  const rowElement = cell.closest('[data-row-key]');
  if (!rowElement) return false;
  if (isControlTarget({ target: event.target, container: cell })) return false;
  return api.actions.startEdit({ rowId: rowElement.dataset.rowKey, colKey: cell.dataset.colKey });
}

export default handleEditDoubleClick;
