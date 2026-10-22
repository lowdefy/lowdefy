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
import compileEnrichmentEnqueue from './compileEnrichmentEnqueue.js';
import runEnqueue from './runEnqueue.js';
import requestMetas from '../requestMetas.js';
import schema from './schema.js';

const requestType = 'MongoDBEnrichmentEnqueue';

// Queues the cells of enrichment columns for the worker: the selected rows (inside the base
// filter and tenant) and the mode's cells, never a live one. Cells whose inputs are missing
// are set to empty with the missing column named instead. The writes are unordered bulkWrites
// of 1000 cells, and nothing is written when more than `maxCells` cells would be. With
// `dryRun` it reads and plans exactly as a run does, then returns the counts the run would
// write, by column, writing nothing, so an app can price a run and ask before it spends.
async function MongoDBEnrichmentEnqueue(context) {
  const { connection, request, tenant, tenantGuard } = context;
  assertTenantWritable({ tenantGuard, requestType });
  const properties = deserialize(request);
  const compiled = compileEnrichmentEnqueue({
    properties,
    tenantScoped: Boolean(tenant),
    now: new Date(),
  });
  const { collection, logCollection } = await getCollection({ connection });
  try {
    const response = await runEnqueue({ collection, logCollection, compiled, properties, context });
    return serialize(response);
  } catch (error) {
    throw mapMongoError(error, { connection, requestType });
  }
}

MongoDBEnrichmentEnqueue.schema = schema;
MongoDBEnrichmentEnqueue.meta = requestMetas.MongoDBEnrichmentEnqueue;

export default MongoDBEnrichmentEnqueue;
