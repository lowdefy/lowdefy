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

import applyTenantToBulkOperations from '../tenant/applyTenantToBulkOperations.js';
import { assertUnscopedBulkOperations } from '../tenant/guardUnscopedWrite.js';
import getCollection from '../getCollection.js';
import verifyStoredTenant, { idsOfMap } from '../tenant/verifyStoredTenant.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

async function MongodbBulkWrite({
  connection,
  connectionId,
  endpointId,
  request,
  requestId,
  tenant,
  tenantGuard,
}) {
  const deserializedRequest = deserialize(request);
  const { options } = deserializedRequest;
  let { operations } = deserializedRequest;
  if (tenant) {
    operations = applyTenantToBulkOperations({ operations, tenant });
  }
  if (tenantGuard) {
    assertUnscopedBulkOperations({ operations, field: tenantGuard.field });
  }
  const { collection } = await getCollection({ connection });
  let response;
  try {
    response = await collection.bulkWrite(operations, options);
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBBulkWrite' });
  }
  await verifyStoredTenant({
    collection,
    connectionId,
    endpointId,
    ids: [...idsOfMap(response.insertedIds), ...idsOfMap(response.upsertedIds)],
    requestId,
    requestType: 'MongoDBBulkWrite',
    tenant,
    tenantGuard,
  });
  return serialize(response);
}

MongodbBulkWrite.schema = schema;
MongodbBulkWrite.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongodbBulkWrite;
