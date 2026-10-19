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

import createAddRow from './createAddRow.js';
import createCancelEdit from './createCancelEdit.js';
import createCommitEdit from './createCommitEdit.js';
import createDeleteRow from './createDeleteRow.js';
import createMoveRow from './createMoveRow.js';
import createResetChanges from './createResetChanges.js';
import createSaveCellEdit from './createSaveCellEdit.js';
import createSaveRowMove from './createSaveRowMove.js';
import createStartEdit from './createStartEdit.js';
import createStepHistory from './createStepHistory.js';
import createWriteCell from './createWriteCell.js';
import createWriteChanges from './createWriteChanges.js';
import handleEditDoubleClick from './handleEditDoubleClick.js';
import handleEditKeyDown from './handleEditKeyDown.js';
import handleRowControlsClick from './handleRowControlsClick.js';
import handleRowDragPointerDown from './handleRowDragPointerDown.js';
import useEditingData from './useEditingData.js';
import useEditingFragments from './useEditingFragments.js';
import useEditingGrid from './useEditingGrid.js';

// Cell editing (D8) and row reorder for Table and TableInput. Table edits and moves are events:
// onCellEdit / onRowMove are awaited while the table shows the change optimistically (keyed by
// row key, never by writing `data`). TableInput records edits, added and deleted rows and moves
// in its value, a changeset over `data`, with undo/redo. Placed before selection, keyboard and
// events: its keys (Enter, F2, typing) and double-click win over row activation, and clicks on
// the row controls never select.
const editingFeature = {
  name: 'editing',
  useRows: useEditingData,
  useFeature: useEditingFragments,
  useGridFeature: useEditingGrid,
  actions: {
    addRow: createAddRow,
    cancelEdit: createCancelEdit,
    commitEdit: createCommitEdit,
    deleteRow: createDeleteRow,
    moveRow: createMoveRow,
    resetChanges: createResetChanges,
    saveCellEdit: createSaveCellEdit,
    saveRowMove: createSaveRowMove,
    startEdit: createStartEdit,
    stepHistory: createStepHistory,
    writeCell: createWriteCell,
    writeChanges: createWriteChanges,
  },
  gridHandlers: {
    click: handleRowControlsClick,
    dblclick: handleEditDoubleClick,
    keydown: handleEditKeyDown,
    pointerdown: handleRowDragPointerDown,
  },
};

export default editingFeature;
