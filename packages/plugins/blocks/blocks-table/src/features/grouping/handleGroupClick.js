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

import scrollToCell from '../virtualization/scrollToCell.js';

// A click on a group header row toggles the group; on its checkbox, selects the group's rows. A
// toggle from the sticky overlay also scrolls the group's own header back to its slot, so the
// rows that collapsed away do not leave the view somewhere below, and moves focus to that header
// (the overlay is a hidden copy).
function handleGroupClick(event, api) {
  const rowElement = event.target.closest('[data-group-key]');
  if (!rowElement || !api.contains(rowElement)) return false;
  const key = rowElement.dataset.groupKey;
  if (event.target.closest('[data-lf-group-select]')) {
    api.actions.toggleGroupSelected({ key });
    return true;
  }
  api.actions.toggleGroup({ key });
  if (rowElement.closest('[data-lf-group-sticky]')) {
    const row = Number(rowElement.dataset.groupIndex);
    // An inner group's header goes to its own slot, under its outer groups' sticky headers.
    const startInset = Number(rowElement.dataset.groupDepth) * api.rowHeight;
    scrollToCell({ api, row, col: -1, align: 'start', startInset });
    api.keyboard.moveTo({ row, col: api.keyboard.activeCell.col });
  }
  return true;
}

export default handleGroupClick;
