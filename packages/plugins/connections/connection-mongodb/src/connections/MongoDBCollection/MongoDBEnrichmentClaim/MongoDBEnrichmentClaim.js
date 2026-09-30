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

import { randomBytes } from 'node:crypto';

import getCollection from '../getCollection.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import writeEnrichmentLog from '../enrichment/writeEnrichmentLog.js';
import compileEnrichmentClaim from './compileEnrichmentClaim.js';
import runClaim from './runClaim.js';
import schema from './schema.js';

const requestType = 'MongoDBEnrichmentClaim';

function generateToken() {
  return randomBytes(12).toString('hex');
}

// Claims queued enrichment cells for a worker: the oldest due cells (and running cells whose
// lease ran out), each set to running with a lease and a unique claimToken by a
// compare-and-set, so concurrent workers never claim the same cell. Returns the claims with
// the row (its `fields` only) and the inputs resolved from `columnDefs`.
async function MongoDBEnrichmentClaim(context) {
  const { connection, request, tenant, tenantGuard } = context;
  const properties = deserialize(request);
  const compiled = compileEnrichmentClaim({ properties, tenantScoped: Boolean(tenant) });
  if (compiled.targets.length === 0) return [];
  const { collection, logCollection } = await getCollection({ connection });
  let run;
  try {
    run = await runClaim({
      collection,
      compiled,
      generateToken,
      logCollection,
      now: new Date(),
      tenant,
      tenantGuard,
    });
  } catch (error) {
    throw mapMongoError(error, { connection, requestType });
  }
  if (run.written > 0) {
    try {
      await writeEnrichmentLog({
        args: {
          claimed: run.claims.map(({ rowKey, columnKey, claimToken }) => ({
            rowKey,
            columnKey,
            claimToken,
          })),
          columns: compiled.targets.map((target) => target.columnKey),
          limit: compiled.limit,
        },
        context,
        logCollection,
        organizationId: run.organizationId,
        response: { claimed: run.claims.length, written: run.written },
        type: requestType,
      });
    } catch (error) {
      throw mapMongoError(error, { connection, requestType });
    }
  }
  return serialize(run.claims);
}

MongoDBEnrichmentClaim.schema = schema;
MongoDBEnrichmentClaim.meta = {
  checkRead: true,
  checkWrite: true,
};

export default MongoDBEnrichmentClaim;
