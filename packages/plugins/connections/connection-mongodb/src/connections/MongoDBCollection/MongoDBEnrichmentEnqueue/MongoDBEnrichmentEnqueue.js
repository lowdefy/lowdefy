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

import getCollection from '../getCollection.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import getEnrichmentLogOrganization from '../enrichment/getEnrichmentLogOrganization.js';
import runBulkWriteBatches from '../enrichment/runBulkWriteBatches.js';
import scopeWriteOperations from '../enrichment/scopeWriteOperations.js';
import writeEnrichmentLog from '../enrichment/writeEnrichmentLog.js';
import compileEnrichmentEnqueue from './compileEnrichmentEnqueue.js';
import planEnqueue from './planEnqueue.js';
import schema from './schema.js';

const requestType = 'MongoDBEnrichmentEnqueue';

// Queues the cells of enrichment columns for the worker: the selected rows (inside the base
// filter and tenant) and the mode's cells, never a live one. Cells whose inputs are missing
// are set to empty with the missing column named instead. The writes are unordered bulkWrites
// of 1000 cells, and nothing is written when more than `maxCells` cells would be.
async function MongoDBEnrichmentEnqueue(context) {
  const { connection, request, tenant, tenantGuard } = context;
  const properties = deserialize(request);
  const compiled = compileEnrichmentEnqueue({
    properties,
    tenantScoped: Boolean(tenant),
    now: new Date(),
  });
  const { collection, logCollection } = await getCollection({ connection });
  let response;
  let operations;
  let organizationId;
  try {
    const plan = await planEnqueue({ collection, compiled, tenant });
    const queueOperations = scopeWriteOperations({
      operations: plan.queueOperations,
      tenant,
      tenantGuard,
    });
    const missingOperations = scopeWriteOperations({
      operations: plan.missingOperations,
      tenant,
      tenantGuard,
    });
    operations = [...queueOperations, ...missingOperations];
    organizationId = getEnrichmentLogOrganization({
      filter: compiled.filter,
      logCollection,
      operations,
      tenantGuard,
    });
    const queued = await runBulkWriteBatches({ collection, operations: queueOperations });
    const missing = await runBulkWriteBatches({ collection, operations: missingOperations });
    response = {
      queued: queued.matchedCount,
      skipped: Math.max(0, plan.cellCount - queued.matchedCount - missing.matchedCount),
      missingInputs: missing.matchedCount,
      runId: compiled.runId,
    };
  } catch (error) {
    throw mapMongoError(error, { connection, requestType });
  }
  if (operations.length > 0) {
    try {
      await writeEnrichmentLog({
        args: {
          columns: compiled.targets.map((target) => target.columnKey),
          mode: compiled.mode,
          runId: compiled.runId,
          selection: properties.selection ?? null,
        },
        context,
        logCollection,
        organizationId,
        response,
        type: requestType,
      });
    } catch (error) {
      throw mapMongoError(error, { connection, requestType });
    }
  }
  return serialize(response);
}

MongoDBEnrichmentEnqueue.schema = schema;
MongoDBEnrichmentEnqueue.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongoDBEnrichmentEnqueue;
