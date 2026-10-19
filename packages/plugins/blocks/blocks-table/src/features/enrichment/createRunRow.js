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

import showEventError from './showEventError.js';
import triggerEnrichmentEvent from './triggerEnrichmentEvent.js';

// Action `runRow({ rowId })`: a row's run button. Fires onRowRun `{ row, rowKey, columns }` with
// the keys of every enrichment and ai column.
function createRunRow(api) {
  return async function runRow({ rowId }) {
    const row = api.table.getRow(rowId, true);
    if (!row) return null;
    const error = await triggerEnrichmentEvent({
      api,
      name: 'onRowRun',
      event: {
        row: row.original,
        rowKey: api.config.getKey(row.original),
        columns: api.config.enrichment.runColumns.map((column) => column.key),
      },
    });
    return showEventError({ api, error });
  };
}

export default createRunRow;
