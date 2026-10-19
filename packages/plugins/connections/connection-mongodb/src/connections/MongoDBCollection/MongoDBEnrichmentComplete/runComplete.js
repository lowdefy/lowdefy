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

import runBulkWriteBatches from '../enrichment/runBulkWriteBatches.js';
import planReleaseWaiting from '../enrichment/planReleaseWaiting.js';
import scopeWriteOperations from '../enrichment/scopeWriteOperations.js';
import getDownstream from './getDownstream.js';
import planCompleteCell from './planCompleteCell.js';
import planQueueDownstream from './planQueueDownstream.js';
import readAppliedCells from './readAppliedCells.js';
import readClaimedRows from './readClaimedRows.js';

// Writes the results whose claim still holds, in unordered bulkWrites guarded by the claim
// token, and reports which were applied. When every write matched (the usual case) that is
// all of them; otherwise the written cells are read back. Then the cells of the same rows that
// were waiting for the finished cells are released, and the autoRun columns the ok cells feed
// are queued (`downstream` names them).
async function runComplete({ collection, compiled, now, tenant, tenantGuard }) {
  const { dependentsByColumn, downstreamByColumn, filter, results } = compiled;
  const docs = await readClaimedRows({ collection, compiled, tenant });
  const cells = [];
  results.forEach((result, index) => {
    const doc = docs[index];
    if (doc === null) return;
    cells.push({ ...planCompleteCell({ result, doc, compiled, now }), docId: doc._id, result });
  });
  const operations = scopeWriteOperations({
    operations: cells.map((cell) => cell.operation),
    tenant,
    tenantGuard,
  });
  const written = await runBulkWriteBatches({ collection, operations });
  const applied =
    written.matchedCount === cells.length
      ? cells
      : await readAppliedCells({ collection, cells, tenant });
  const releaseOperations = scopeWriteOperations({
    operations: planReleaseWaiting({
      finished: applied
        .filter((cell) => cell.kind !== 'requeue')
        .map(({ docId, result }) => ({ docId, columnKey: result.columnKey })),
      dependentsByColumn,
      filter,
      now,
    }),
    tenant,
    tenantGuard,
  });
  const released = await runBulkWriteBatches({ collection, operations: releaseOperations });
  const downstreamOperations = scopeWriteOperations({
    operations: planQueueDownstream({ applied, compiled, now }),
    tenant,
    tenantGuard,
  });
  await runBulkWriteBatches({ collection, operations: downstreamOperations });
  return {
    applied,
    response: {
      applied: applied.length,
      ignored: results.length - applied.length,
      requeued: applied.filter((cell) => cell.kind === 'requeue').length,
      released: released.modifiedCount,
      downstream: getDownstream({ applied, downstreamByColumn }),
    },
  };
}

export default runComplete;
