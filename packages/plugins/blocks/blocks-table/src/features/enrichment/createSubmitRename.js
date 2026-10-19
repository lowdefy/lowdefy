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

import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import getRawColumn from './getRawColumn.js';
import setUi from './setUi.js';
import triggerEnrichmentEvent from './triggerEnrichmentEvent.js';

function setRenaming({ api, key, patch }) {
  setUi({
    api,
    patch: (ui) => ({
      renaming: ui.renaming?.key === key ? { ...ui.renaming, ...patch } : ui.renaming,
    }),
  });
}

// Action `submitRename({ key, title })`: fires onColumnUpdate `{ column, previous }` with the new
// title while the input shows it saving; closes on success, stays open with the error on failure.
// An empty or unchanged title just closes the input.
function createSubmitRename(api) {
  return async function submitRename({ key, title }) {
    const column = api.config.columnsByKey.get(key);
    const next = title.trim();
    if (!column || next === '' || next === htmlToText(column.title)) {
      setUi({ api, patch: { renaming: null } });
      return;
    }
    if (api.enrichment.ui.renaming?.status === 'saving') return;
    setRenaming({ api, key, patch: { status: 'saving', error: null } });
    const previous = getRawColumn({ api, key });
    const error = await triggerEnrichmentEvent({
      api,
      name: 'onColumnUpdate',
      event: { column: { ...previous, title: next }, previous },
    });
    if (error === null) {
      setUi({ api, patch: (ui) => ({ renaming: ui.renaming?.key === key ? null : ui.renaming }) });
      return;
    }
    setRenaming({ api, key, patch: { status: 'idle', error } });
  };
}

export default createSubmitRename;
