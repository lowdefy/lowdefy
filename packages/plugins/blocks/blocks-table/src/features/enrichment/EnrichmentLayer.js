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

import React, { Suspense } from 'react';

import DeleteColumnConfirm from './DeleteColumnConfirm.js';
import EnrichmentNotice from './EnrichmentNotice.js';
import LazyCellDetails from './LazyCellDetails.js';
import LazyColumnPicker from './LazyColumnPicker.js';
import LazyImportDialog from './LazyImportDialog.js';
import OverlayLoading from './OverlayLoading.js';

// The enrichment overlays, each mounted only while open: the add / edit column picker, the cell
// details panel, the delete confirmation, the CSV import dialog, and the notice line for failed
// events. They are antd Drawers and Modals; the picker, the details panel and the import dialog
// are chunks of their own, loaded the first time one opens, with a drawer or dialog of the same
// size and a spinner until then (OverlayLoading, D17).
function EnrichmentLayer({ api, ui }) {
  return (
    <>
      {ui.notice ? <EnrichmentNotice api={api} notice={ui.notice} /> : null}
      {ui.picker ? (
        <Suspense
          fallback={
            <OverlayLoading
              api={api}
              name="picker"
              size={520}
              title={ui.picker.mode === 'edit' ? 'Edit column' : 'Add column'}
            />
          }
        >
          <LazyColumnPicker api={api} picker={ui.picker} />
        </Suspense>
      ) : null}
      {ui.details ? (
        <Suspense
          fallback={
            <OverlayLoading api={api} mask={false} name="details" size={440} title="Cell" />
          }
        >
          <LazyCellDetails api={api} details={ui.details} />
        </Suspense>
      ) : null}
      {ui.importing ? (
        <Suspense
          fallback={
            <OverlayLoading api={api} kind="modal" name="importing" size={640} title="Import CSV" />
          }
        >
          <LazyImportDialog api={api} />
        </Suspense>
      ) : null}
      {ui.deleting ? <DeleteColumnConfirm api={api} deleting={ui.deleting} /> : null}
    </>
  );
}

export default EnrichmentLayer;
