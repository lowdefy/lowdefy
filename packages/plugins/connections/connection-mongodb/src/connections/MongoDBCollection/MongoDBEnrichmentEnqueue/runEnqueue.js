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
import scopeWriteOperations from '../enrichment/scopeWriteOperations.js';
import writeEnrichmentLog from '../enrichment/writeEnrichmentLog.js';
import countCells from './countCells.js';
import planEnqueue from './planEnqueue.js';

const requestType = 'MongoDBEnrichmentEnqueue';

// An enqueue on its collection: the plan, then either its counts (a dry run, which writes
// nothing, neither cells nor the change log) or its writes, column by column so each column's
// counts are what it wrote, and the change log record of a run that wrote cells.
async function runEnqueue({ collection, logCollection, compiled, properties, context }) {
  const { tenant, tenantGuard } = context;
  const plan = await planEnqueue({ collection, compiled, tenant });
  if (properties.dryRun === true) {
    return {
      dryRun: true,
      ...countCells({
        cellCount: plan.cellCount,
        columns: plan.columns.map((column) => ({
          columnKey: column.columnKey,
          queued: column.queueOperations.length,
          missingInputs: column.missingOperations.length,
        })),
      }),
    };
  }
  let written = 0;
  const counted = [];
  for (const column of plan.columns) {
    const queueOperations = scopeWriteOperations({
      operations: column.queueOperations,
      tenant,
      tenantGuard,
    });
    const missingOperations = scopeWriteOperations({
      operations: column.missingOperations,
      tenant,
      tenantGuard,
    });
    written += queueOperations.length + missingOperations.length;
    const queued = await runBulkWriteBatches({ collection, operations: queueOperations });
    const missing = await runBulkWriteBatches({ collection, operations: missingOperations });
    counted.push({
      columnKey: column.columnKey,
      queued: queued.matchedCount,
      missingInputs: missing.matchedCount,
    });
  }
  const response = {
    ...countCells({ cellCount: plan.cellCount, columns: counted }),
    runId: compiled.runId,
  };
  if (written > 0) {
    await writeEnrichmentLog({
      args: {
        columns: compiled.targets.map((target) => target.columnKey),
        mode: compiled.mode,
        runId: compiled.runId,
        selection: properties.selection ?? null,
      },
      context,
      logCollection,
      response,
      type: requestType,
    });
  }
  return response;
}

export default runEnqueue;
