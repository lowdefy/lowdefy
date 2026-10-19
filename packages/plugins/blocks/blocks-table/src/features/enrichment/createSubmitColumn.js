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

import getRawColumn from './getRawColumn.js';
import setUi from './setUi.js';
import triggerEnrichmentEvent from './triggerEnrichmentEvent.js';

function setPicker({ api, patch }) {
  setUi({ api, patch: (ui) => ({ picker: ui.picker ? { ...ui.picker, ...patch } : null }) });
}

// Action `submitColumn({ column })`: the picker's submit. A new column fires onColumnAdd
// `{ column, position }`, an edited one onColumnUpdate `{ column, previous }`. The picker stays
// open with a pending state while the event runs (the app stores the column and re-reads its
// columns), closes on success and shows the action's error on failure.
function createSubmitColumn(api) {
  return async function submitColumn({ column }) {
    const { picker } = api.enrichment.ui;
    if (!picker || picker.status === 'saving') return;
    setPicker({ api, patch: { status: 'saving', error: null } });
    const error =
      picker.mode === 'edit'
        ? await triggerEnrichmentEvent({
            api,
            name: 'onColumnUpdate',
            event: { column, previous: getRawColumn({ api, key: picker.key }) },
          })
        : await triggerEnrichmentEvent({
            api,
            name: 'onColumnAdd',
            event: { column, position: picker.position },
          });
    if (error === null) {
      setUi({ api, patch: { picker: null } });
      return;
    }
    setPicker({ api, patch: { status: 'idle', error } });
  };
}

export default createSubmitColumn;
