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

import React, { useEffect, useMemo } from 'react';

import AddRowButton from './AddRowButton.js';
import EditingLayer from './EditingLayer.js';
import getReorderBlock from './getReorderBlock.js';
import rowControlsColumn from './rowControlsColumn.js';

const EMPTY = [];

// Block-level editing fragment: the row controls column (`rowDrag`, or TableInput's
// `rowActions.delete`), and under the grid the editing layer (editor and status markers,
// portalled into cells) plus TableInput's "+ Add row". It also registers TableInput's
// `resetChanges` method. Nothing mounts for a table without editing.
function useEditingFragments({ api, config, data, state, table }) {
  const { editing } = api;
  const { addRow, addRowText, deleteButton, positionField, rowDrag } = editing.options;
  const leadingColumns = useMemo(
    () => (rowDrag || deleteButton ? [rowControlsColumn({ rowDrag, deleteButton })] : EMPTY),
    [rowDrag, deleteButton]
  );
  const block = rowDrag ? getReorderBlock({ config, data, positionField, state, table }) : null;
  useEffect(() => {
    editing.reorderBlock.set(block);
  }, [block]);
  useEffect(() => {
    // Load the editor chunk while the user reads, so the first edit opens without a wait.
    if (editing.enabled) import('./CellEditor.js');
  }, [editing.enabled]);
  const inputMethods = editing.input?.methods;
  useEffect(() => {
    if (!inputMethods) return;
    inputMethods.registerMethod('resetChanges', api.actions.resetChanges);
  }, [inputMethods]);

  if (!editing.enabled) return { leadingColumns };
  return {
    leadingColumns,
    regions: {
      bottom: (
        <>
          <EditingLayer api={api} />
          {addRow ? <AddRowButton api={api} text={addRowText} /> : null}
        </>
      ),
    },
  };
}

export default useEditingFragments;
