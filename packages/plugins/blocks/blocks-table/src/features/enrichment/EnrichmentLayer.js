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

import React, { lazy, Suspense } from 'react';

import DeleteColumnConfirm from './DeleteColumnConfirm.js';
import EnrichmentNotice from './EnrichmentNotice.js';

// The overlays are antd Drawers and Modals in their own chunks, loaded the first time one opens.
const CellDetails = lazy(() => import('./CellDetails.js'));
const ColumnPicker = lazy(() => import('./ColumnPicker.js'));
const ImportDialog = lazy(() => import('./ImportDialog.js'));

// The enrichment overlays, each mounted only while open: the add / edit column picker, the cell
// details panel, the delete confirmation, the CSV import dialog, and the notice line for failed
// events.
function EnrichmentLayer({ api, ui }) {
  return (
    <>
      {ui.notice ? <EnrichmentNotice api={api} notice={ui.notice} /> : null}
      <Suspense fallback={null}>
        {ui.picker ? <ColumnPicker api={api} picker={ui.picker} /> : null}
        {ui.details ? <CellDetails api={api} details={ui.details} /> : null}
        {ui.importing ? <ImportDialog api={api} /> : null}
      </Suspense>
      {ui.deleting ? <DeleteColumnConfirm api={api} deleting={ui.deleting} /> : null}
    </>
  );
}

export default EnrichmentLayer;
