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
import assertTenantWritable from '../tenant/assertTenantWritable.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import writeEnrichmentLog from '../enrichment/writeEnrichmentLog.js';
import compileEnrichmentComplete from './compileEnrichmentComplete.js';
import runComplete from './runComplete.js';
import requestMetas from '../requestMetas.js';
import schema from './schema.js';

const requestType = 'MongoDBEnrichmentComplete';

// Writes a worker's results to the cells it claimed. A result is applied only while the cell
// still holds its claim (the claimToken, status running), so a worker whose lease ran out
// can not overwrite a newer run. Errors are retried up to maxAttempts, after the result's
// retryAfterMs or an exponential backoff. Queues the autoRun columns the completed cells feed
// and names them in the response.
async function MongoDBEnrichmentComplete(context) {
  const { connection, request, tenant, tenantGuard } = context;
  assertTenantWritable({ tenantGuard, requestType });
  const properties = deserialize(request);
  const compiled = compileEnrichmentComplete({ properties, tenantScoped: Boolean(tenant) });
  if (compiled.results.length === 0) {
    return { applied: 0, ignored: 0, requeued: 0, released: 0, downstream: [] };
  }
  const { collection, logCollection } = await getCollection({ connection });
  let run;
  try {
    run = await runComplete({
      collection,
      compiled,
      now: new Date(),
      tenant,
      tenantGuard,
    });
  } catch (error) {
    throw mapMongoError(error, { connection, requestType });
  }
  if (run.applied.length > 0) {
    try {
      await writeEnrichmentLog({
        args: {
          results: run.applied.map(({ kind, result }) => ({
            rowKey: result.rowKey,
            columnKey: result.columnKey,
            claimToken: result.claimToken,
            status: kind,
            value: kind === 'ok' ? result.value : undefined,
          })),
        },
        context,
        logCollection,
        response: run.response,
        type: requestType,
      });
    } catch (error) {
      throw mapMongoError(error, { connection, requestType });
    }
  }
  return serialize(run.response);
}

MongoDBEnrichmentComplete.schema = schema;
MongoDBEnrichmentComplete.meta = requestMetas.MongoDBEnrichmentComplete;

export default MongoDBEnrichmentComplete;
