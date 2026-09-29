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

import { rowSelectionFeature } from '@tanstack/react-table';

import createClearSelection from './createClearSelection.js';
import createToggleAllRowsSelected from './createToggleAllRowsSelected.js';
import createToggleRowSelected from './createToggleRowSelected.js';
import handleSelectionClick from './handleSelectionClick.js';
import initRowSelection from './initRowSelection.js';
import initSelectionMode from './initSelectionMode.js';
import notifySelectionChange from './notifySelectionChange.js';
import pruneRowSelection from './pruneRowSelection.js';
import selectionToValue from './selectionToValue.js';
import useSelection from './useSelection.js';

// `rowSelection` is TanStack's selection record (row id -> true); `selectionMode` is Lowdefy's
// own slice ('keys' | 'all') that decides which value shape the selection is written back in.
const selectionFeature = {
  name: 'selection',
  tableFeatures: { rowSelectionFeature },
  slices: {
    rowSelection: { init: initRowSelection, cause: 'select', normalize: pruneRowSelection },
    selectionMode: { init: initSelectionMode, cause: 'select' },
  },
  tableOptions: ({ config }) => ({
    enableRowSelection: Boolean(config.rowSelection),
    enableMultiRowSelection: config.rowSelection?.type !== 'radio',
  }),
  toValue: selectionToValue,
  onCommit: notifySelectionChange,
  actions: {
    clearSelection: createClearSelection,
    toggleRowSelected: createToggleRowSelected,
    toggleAllRowsSelected: createToggleAllRowsSelected,
  },
  methods: { clearSelection: createClearSelection },
  gridHandlers: { click: handleSelectionClick },
  useFeature: useSelection,
};

export default selectionFeature;
