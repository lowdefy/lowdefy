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

import createAddColumn from './createAddColumn.js';
import createAddExtractColumn from './createAddExtractColumn.js';
import createAddRow from './createAddRow.js';
import createCloseOverlay from './createCloseOverlay.js';
import createConfirmDelete from './createConfirmDelete.js';
import createDuplicateColumn from './createDuplicateColumn.js';
import createImportRows from './createImportRows.js';
import createOpenCellDetails from './createOpenCellDetails.js';
import createOpenColumnPicker from './createOpenColumnPicker.js';
import createOpenImport from './createOpenImport.js';
import createRequestDelete from './createRequestDelete.js';
import createRunCell from './createRunCell.js';
import createRunColumn from './createRunColumn.js';
import createRunRow from './createRunRow.js';
import createStartRename from './createStartRename.js';
import createSubmitColumn from './createSubmitColumn.js';
import createSubmitRename from './createSubmitRename.js';
import EnrichmentCell from './EnrichmentCell.js';
import getEnrichmentMenuItems from './getEnrichmentMenuItems.js';
import handleEnrichmentClick from './handleEnrichmentClick.js';
import handleEnrichmentKeyDown from './handleEnrichmentKeyDown.js';
import handleEnrichmentPreload from './handleEnrichmentPreload.js';
import ImportButton from './ImportButton.js';
import RenameInput from './RenameInput.js';
import RunProgress from './RunProgress.js';
import RunSelectedButton from './RunSelectedButton.js';
import useEnrichment from './useEnrichment.js';
import usePauseWhileScrolling from './usePauseWhileScrolling.js';

// Clay-style enrichment tables (design code-docs/plans/enrichment-tables.md, E2, E3, E6): column
// kinds with a run state per cell (queued, running, ok, error, empty, stale), the header progress
// chip, the add / edit column picker and column management in the header menu, runs of a
// column, a row, the selection or a cell, the cell details panel with its raw result, "+ New
// row" and CSV import. Everything is an event (onColumnAdd, onColumnUpdate, onColumnDelete,
// onColumnRun, onRowRun, onCellRun, onRowAdd, onImport): the app stores columns and rows and
// enqueues runs, and pushes results back with applyTransaction. Placed before sorting, selection,
// editing, keyboard and events, so its header button, run buttons and detail-cell clicks and keys
// are handled first. Its new-row overlay is newRowsFeature, later in the registry. Optional: it
// loads in its own chunk for tables that need it (needsEnrichment.js), and the picker, details
// panel and CSV import dialog load on first use.
const enrichmentFeature = {
  name: 'enrichment',
  useFeature: useEnrichment,
  useGridFeature: usePauseWhileScrolling,
  headerParts: [RunProgress, RenameInput],
  headerMenuItems: getEnrichmentMenuItems,
  cellRenderer: { match: (column) => Boolean(column.stateField), Cell: EnrichmentCell },
  toolbarItems: [ImportButton],
  bulkItems: [RunSelectedButton],
  actions: {
    addColumn: createAddColumn,
    addExtractColumn: createAddExtractColumn,
    addNewRow: createAddRow,
    closeOverlay: createCloseOverlay,
    confirmDelete: createConfirmDelete,
    duplicateColumn: createDuplicateColumn,
    importRows: createImportRows,
    openCellDetails: createOpenCellDetails,
    openColumnPicker: createOpenColumnPicker,
    openImport: createOpenImport,
    requestDelete: createRequestDelete,
    runCell: createRunCell,
    runColumn: createRunColumn,
    runRow: createRunRow,
    startRename: createStartRename,
    submitColumn: createSubmitColumn,
    submitRename: createSubmitRename,
  },
  methods: {
    openCellDetails: createOpenCellDetails,
    openColumnPicker: createOpenColumnPicker,
    openImport: createOpenImport,
  },
  gridHandlers: {
    click: handleEnrichmentClick,
    focus: handleEnrichmentPreload,
    keydown: handleEnrichmentKeyDown,
    pointerover: handleEnrichmentPreload,
  },
};

export default enrichmentFeature;
