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

// Header click sorts; Shift+click adds the column to a multi-sort. The cycle is ascending,
// descending, then off (antd's default sort directions).
function handleSortClick(event, api) {
  const cell = event.target.closest('[data-lf-header]');
  if (!cell || !api.contains(cell) || cell.dataset.special) return false;
  if (event.target.closest('[data-lf-resize]')) return true;
  if (api.takeSuppressedClick()) return true;
  return api.actions.toggleSort({ key: cell.dataset.colKey, multi: event.shiftKey });
}

export default handleSortClick;
