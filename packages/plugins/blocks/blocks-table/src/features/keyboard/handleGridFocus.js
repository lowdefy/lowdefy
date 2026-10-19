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

// Focus that lands on a cell (click, Tab, programmatic) makes it the active cell. Focus on the
// scroller itself means the active cell is outside the rendered window: bring it back.
function handleGridFocus(event, api) {
  if (event.target === api.scrollerRef.current) {
    api.keyboard.moveTo(api.keyboard.activeCell);
    return true;
  }
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || !api.contains(cell)) return false;
  const rowElement = cell.closest('[data-row-index]');
  api.keyboard.setActive({
    row: Number(rowElement.dataset.rowIndex),
    col: Number(cell.dataset.colIndex),
  });
  return false;
}

export default handleGridFocus;
