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

// Action `confirmDelete()`: the delete confirmation's OK. Fires onColumnDelete `{ column }` while
// the dialog shows it pending; closes on success, shows the error on failure.
function createConfirmDelete(api) {
  return async function confirmDelete() {
    const { deleting } = api.enrichment.ui;
    if (!deleting || deleting.status === 'saving') return;
    const { key } = deleting;
    setUi({ api, patch: { deleting: { key, status: 'saving', error: null } } });
    const error = await triggerEnrichmentEvent({
      api,
      name: 'onColumnDelete',
      event: { column: getRawColumn({ api, key }) },
    });
    setUi({
      api,
      patch: (ui) => {
        if (ui.deleting?.key !== key) return {};
        return { deleting: error === null ? null : { key, status: 'idle', error } };
      },
    });
  };
}

export default createConfirmDelete;
