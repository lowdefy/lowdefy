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

function handleSelectionClick(event, api) {
  if (!api.config.rowSelection) return false;
  const all = event.target.closest('[data-lf-select-all]');
  if (all && api.contains(all)) {
    api.actions.toggleAllRowsSelected();
    return true;
  }
  const cell = event.target.closest('[data-lf-select-cell]');
  if (!cell || !api.contains(cell)) return false;
  const rowEl = cell.closest('[data-row-key]');
  api.actions.toggleRowSelected({ id: rowEl.dataset.rowKey });
  return true;
}

export default handleSelectionClick;
