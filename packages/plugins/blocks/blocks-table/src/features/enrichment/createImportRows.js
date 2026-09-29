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

import chunkRows from './chunkRows.js';
import triggerEnrichmentEvent from './triggerEnrichmentEvent.js';

const BATCH_SIZE = 500;

// Action `importRows({ rows, newColumns, onProgress })`: the CSV import's send. Fires onImport
// `{ rows, newColumns, batchIndex, batchCount, total }` once per batch of 500 rows, each awaited
// before the next, `newColumns` with the first batch only (the app creates them once). Stops at
// the first failed batch. Resolves with `{ imported, error }`: the rows sent in the batches that
// succeeded, and the failure message or null.
function createImportRows(api) {
  return async function importRows({ rows, newColumns, onProgress }) {
    const batches = chunkRows({ rows, size: BATCH_SIZE });
    let imported = 0;
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const error = await triggerEnrichmentEvent({
        api,
        name: 'onImport',
        event: {
          rows: batches[batchIndex],
          newColumns: batchIndex === 0 ? newColumns : [],
          batchIndex,
          batchCount: batches.length,
          total: rows.length,
        },
      });
      if (error !== null) return { imported, error };
      imported += batches[batchIndex].length;
      onProgress?.({ imported, total: rows.length });
    }
    return { imported, error: null };
  };
}

export default createImportRows;
