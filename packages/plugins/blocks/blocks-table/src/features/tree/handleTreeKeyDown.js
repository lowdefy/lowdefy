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

// In the tree column (the first data column), Right expands a collapsed row and Left collapses
// an expanded one or moves to the parent row (the ARIA treegrid pattern). Otherwise the arrows
// move between cells as usual.
function handleTreeKeyDown(event, api) {
  if (!api.config.tree || !api.config.keyboard) return false;
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return false;
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || event.target !== cell || !api.contains(cell)) return false;
  const rowElement = cell.closest('[data-row-key]');
  if (!rowElement) return false;
  const col = Number(cell.dataset.colIndex);
  const leadIndex = api.layout.cols.find((layoutCol) => !layoutCol.special)?.index;
  if (col !== leadIndex) return false;
  const item = api.rows[Number(rowElement.dataset.rowIndex)];
  if (item?.depth === undefined) return false;
  if (event.key === 'ArrowRight') {
    if (!item.hasChildren || item.expanded) return false;
    event.preventDefault();
    api.actions.toggleRowExpanded({ id: item.id, expanded: true });
    return true;
  }
  if (item.expanded) {
    event.preventDefault();
    api.actions.toggleRowExpanded({ id: item.id, expanded: false });
    return true;
  }
  if (item.parentId === undefined) return false;
  const parentIndex = api.rows.findIndex((row) => row?.id === item.parentId);
  if (parentIndex === -1) return false;
  event.preventDefault();
  api.keyboard.moveTo({ row: parentIndex, col });
  return true;
}

export default handleTreeKeyDown;
