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
import getRunSelection from './getRunSelection.js';
import showEventError from './showEventError.js';
import triggerEnrichmentEvent from './triggerEnrichmentEvent.js';

// Action `runColumn({ key, mode })`: the header menu's Run (mode all, empty, errors or stale) and
// the bulk bar's "Run selected" (mode all). Fires onColumnRun `{ column, mode, selection }` with
// the rows to run (getRunSelection: the selection, else the whole view); the app enqueues the
// cells (MongoDBEnrichmentEnqueue) and the cells show their state as it changes.
function createRunColumn(api) {
  return async function runColumn({ key, mode = 'all' }) {
    const error = await triggerEnrichmentEvent({
      api,
      name: 'onColumnRun',
      event: { column: getRawColumn({ api, key }), mode, selection: getRunSelection({ api }) },
    });
    return showEventError({ api, error });
  };
}

export default createRunColumn;
