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
import { ObjectId } from 'mongodb';

import assertTenantWritable from '../tenant/assertTenantWritable.js';
import applyTenantToBulkOperations from '../tenant/applyTenantToBulkOperations.js';
import stampTenantOnLogRecord from '../tenant/stampTenantOnLogRecord.js';
import { assertUnscopedBulkOperations } from '../tenant/guardUnscopedWrite.js';
import getCollection from '../getCollection.js';
import verifyStoredTenant, { idsOfMap } from '../tenant/verifyStoredTenant.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import compileTableChanges from './compileTableChanges.js';
import readChangesResult from './readChangesResult.js';
import runChanges from './runChanges.js';
import requestMetas from '../requestMetas.js';
import schema from './schema.js';

function generateId() {
  return new ObjectId();
}

// Saves a TableInput changeset. The browser sends only what changed; it is validated against
// the `fields` allowlist and compiled to one bulkWrite on the server, every operation scoped
// by the base filter. The browser never sends MongoDB syntax. The response lists the rows
// that matched nothing in `unmatchedKeys`.
async function MongoDBTableChanges({
  endpointId,
  blockId,
  connection,
  connectionId,
  pageId,
  payload,
  request,
  requestId,
  tenant,
  tenantGuard,
}) {
  assertTenantWritable({ tenantGuard, requestType: 'MongoDBTableChanges' });
  const properties = deserialize(request);
  const compiled = compileTableChanges({
    properties,
    tenantScoped: Boolean(tenant),
    generateId,
    now: new Date(),
  });
  let { operations } = compiled;
  if (tenant) {
    operations = applyTenantToBulkOperations({ operations, tenant });
  }
  if (tenantGuard) {
    assertUnscopedBulkOperations({ operations, field: tenantGuard.field });
  }
  const { collection, logCollection } = await getCollection({ connection });
  let run;
  try {
    run = await runChanges({ collection, compiled, operations });
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBTableChanges' });
  }
  await verifyStoredTenant({
    collection,
    connectionId,
    endpointId,
    ids: [...idsOfMap(run.result?.insertedIds), ...idsOfMap(run.result?.upsertedIds)],
    requestId,
    requestType: 'MongoDBTableChanges',
    tenant,
    tenantGuard,
  });
  const response = readChangesResult({ compiled, ...run });
  if (logCollection) {
    try {
      await logCollection.insertOne(
        stampTenantOnLogRecord({
          record: {
            args: { changes: properties.changes, operations, options: compiled.options },
            blockId,
            connectionId,
            pageId,
            payload,
            requestId,
            response,
            timestamp: new Date(),
            type: 'MongoDBTableChanges',
            meta: connection.changeLog?.meta,
          },
          tenant,
        })
      );
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBTableChanges' });
    }
  }
  return serialize(response);
}

MongoDBTableChanges.schema = schema;
MongoDBTableChanges.meta = requestMetas.MongoDBTableChanges;

export default MongoDBTableChanges;
