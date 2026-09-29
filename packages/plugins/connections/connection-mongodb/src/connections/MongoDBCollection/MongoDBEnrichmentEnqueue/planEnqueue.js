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

import andConditions from '../enrichment/andConditions.js';
import scopeReadFilter from '../enrichment/scopeReadFilter.js';
import planEnqueueCell from './planEnqueueCell.js';

const requestType = 'MongoDBEnrichmentEnqueue';

// Reads the cells an enqueue writes, one column at a time, in batches of 1000 rows with only
// the `_id`, input and inputHash paths projected. Stale cells can only be found by hashing
// each row's current inputs (no server-side JavaScript), so the read is what bounds the work:
// it stops, before anything is written, as soon as more than `maxCells` cells would be
// written, and `maxTimeMS` bounds its time. Rows whose inputs are unchanged are read and
// dropped, so memory holds at most `maxCells` planned writes.
async function planEnqueue({ collection, compiled, tenant }) {
  const { maxCells, maxTimeMS, scope, targets } = compiled;
  const rowCount = await collection.countDocuments(scopeReadFilter({ filter: scope, tenant }), {
    maxTimeMS,
  });
  const queueOperations = [];
  const missingOperations = [];
  for (const target of targets) {
    const cursor = collection.find(
      scopeReadFilter({ filter: andConditions([scope, target.condition]), tenant }),
      { projection: target.projection, sort: { _id: 1 }, batchSize: 1000, maxTimeMS }
    );
    try {
      for await (const doc of cursor) {
        const cell = planEnqueueCell({ doc, target, compiled });
        if (cell.kind === 'queue') queueOperations.push(cell.operation);
        if (cell.kind === 'missing') missingOperations.push(cell.operation);
        if (queueOperations.length + missingOperations.length > maxCells) {
          throw new Error(
            `${requestType} would write more than "maxCells" (${maxCells}) cells. Narrow the selection or the columns, or raise "maxCells". Nothing was queued.`
          );
        }
      }
    } finally {
      await cursor.close();
    }
  }
  return { cellCount: rowCount * targets.length, queueOperations, missingOperations };
}

export default planEnqueue;
