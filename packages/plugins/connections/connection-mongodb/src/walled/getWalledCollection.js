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

import { ConfigError } from '@lowdefy/errors';

import applyTenantToFilter from '../connections/MongoDBCollection/tenant/applyTenantToFilter.js';
import assertTenantWritable from '../connections/MongoDBCollection/tenant/assertTenantWritable.js';
import applyTenantToUpdate from '../connections/MongoDBCollection/tenant/applyTenantToUpdate.js';
import getCollection from '../connections/MongoDBCollection/getCollection.js';
import mapMongoError from '../connections/MongoDBCollection/mapMongoError.js';
import stampTenantOnLogRecord from '../connections/MongoDBCollection/tenant/stampTenantOnLogRecord.js';
import verifyStoredTenant from '../connections/MongoDBCollection/tenant/verifyStoredTenant.js';
import { assertUnscopedUpdate } from '../connections/MongoDBCollection/tenant/guardUnscopedWrite.js';
import { serialize, deserialize } from '../connections/MongoDBCollection/serialize.js';

import MongoDBAggregation from '../connections/MongoDBCollection/MongoDBAggregation/MongoDBAggregation.js';
import MongoDBBulkWrite from '../connections/MongoDBCollection/MongoDBBulkWrite/MongoDBBulkWrite.js';
import MongoDBDeleteMany from '../connections/MongoDBCollection/MongoDBDeleteMany/MongoDBDeleteMany.js';
import MongoDBDeleteOne from '../connections/MongoDBCollection/MongoDBDeleteOne/MongoDBDeleteOne.js';
import MongoDBFind from '../connections/MongoDBCollection/MongoDBFind/MongoDBFind.js';
import MongoDBFindOne from '../connections/MongoDBCollection/MongoDBFindOne/MongoDBFindOne.js';
import MongoDBInsertMany from '../connections/MongoDBCollection/MongoDBInsertMany/MongoDBInsertMany.js';
import MongoDBInsertOne from '../connections/MongoDBCollection/MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBUpdateMany from '../connections/MongoDBCollection/MongoDBUpdateMany/MongoDBUpdateMany.js';
import MongoDBUpdateOne from '../connections/MongoDBCollection/MongoDBUpdateOne/MongoDBUpdateOne.js';

// The walled MongoDB client: the only way a plugin reaches a walled database.
//
// Every method that has a stock request type (find, findOne, aggregate,
// insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany,
// bulkWrite) runs THAT request type's resolver, with the same tenant verdict
// and unscoped-write guard the request layer would hand it - so the wall, the
// change log and the stored-tenant verification are the stock code, not a
// copy of it. countDocuments and findOneAndUpdate have no stock request; they
// call the same wall functions the stock requests call.
//
// Values cross the stock resolvers in their request/response form (serialize /
// deserialize), the same round trip a request's properties take, so ObjectIds
// and Dates survive; exotic BSON types (Decimal128, Binary) are not preserved.
// No cursor ever leaves: find and aggregate return arrays.
//
// With no tenant and no tenantGuard (a non-tenant app) the wall functions are
// not applied, exactly as with the stock requests.
function getWalledCollection({
  connection,
  endpointId,
  requestId,
  tenant,
  tenantGuard,
  connectionId,
}) {
  const base = {
    connection,
    connectionId,
    endpointId,
    requestId,
    tenant: tenant ?? null,
    tenantGuard: tenantGuard ?? null,
  };

  function assertWrite(method) {
    assertTenantWritable({ tenantGuard, requestType: `The walled MongoDB client's "${method}"` });
    if (connection.write !== true) {
      throw new ConfigError(
        `Walled MongoDB client can not run "${method}": the connection does not allow writes.`
      );
    }
  }

  function assertRead(method) {
    if (connection.read === false) {
      throw new ConfigError(
        `Walled MongoDB client can not run "${method}": the connection does not allow reads.`
      );
    }
  }

  // Run a stock resolver and hand back native driver values.
  async function run(resolver, request) {
    const response = await resolver({ ...base, request: serialize(request) });
    return deserialize(response);
  }

  function assertNoOutOrMerge(pipeline) {
    (pipeline ?? []).forEach((stage) => {
      if (stage.$out != null || stage.$merge != null) {
        throw new ConfigError(
          'The walled MongoDB client refuses "$out" and "$merge" stages - they write whole collections outside the tenant wall.'
        );
      }
    });
  }

  return {
    async find(filter, options) {
      assertRead('find');
      return run(MongoDBFind, { query: filter ?? {}, options });
    },
    async findOne(filter, options) {
      assertRead('findOne');
      return run(MongoDBFindOne, { query: filter ?? {}, options });
    },
    async aggregate(pipeline, options) {
      assertRead('aggregate');
      assertNoOutOrMerge(pipeline);
      return run(MongoDBAggregation, { pipeline, options });
    },
    async countDocuments(filter, options) {
      assertRead('countDocuments');
      let query = deserialize(serialize(filter ?? {}));
      if (tenant) {
        query = applyTenantToFilter({ filter: query, tenant, position: 'a filter' });
      }
      const { collection } = await getCollection({ connection });
      try {
        return await collection.countDocuments(query, options);
      } catch (error) {
        throw mapMongoError(error, { connection, requestType: 'MongoDBCountDocuments' });
      }
    },
    async insertOne(doc, options) {
      assertWrite('insertOne');
      return run(MongoDBInsertOne, { doc, options });
    },
    async insertMany(docs, options) {
      assertWrite('insertMany');
      return run(MongoDBInsertMany, { docs, options });
    },
    async updateOne(filter, update, options) {
      assertWrite('updateOne');
      return run(MongoDBUpdateOne, { filter, update, options, disableNoMatchError: true });
    },
    async updateMany(filter, update, options) {
      assertWrite('updateMany');
      return run(MongoDBUpdateMany, { filter, update, options });
    },
    async findOneAndUpdate(filter, update, options) {
      assertWrite('findOneAndUpdate');
      let query = deserialize(serialize(filter ?? {}));
      let change = deserialize(serialize(update));
      const upsert = options?.upsert === true;
      if (tenant) {
        query = applyTenantToFilter({ filter: query, tenant, position: 'a filter' });
        change = applyTenantToUpdate({ update: change, tenant, upsert });
      }
      if (tenantGuard) {
        assertUnscopedUpdate({ update: change, filter: query, field: tenantGuard.field, upsert });
      }
      const { collection, logCollection } = await getCollection({ connection });
      let result;
      let before = null;
      try {
        if (logCollection) before = await collection.findOne(query);
        result = await collection.findOneAndUpdate(query, change, {
          ...options,
          includeResultMetadata: true,
        });
        let after = result.value;
        if (logCollection && options?.returnDocument !== 'after' && result.value) {
          // The driver returned the pre-update row; the log records the row left behind.
          after = await collection.findOne({ _id: result.value._id });
        }
        if (logCollection) {
          await logCollection.insertOne(
            stampTenantOnLogRecord({
              record: {
                args: { filter: query, update: change, options },
                connectionId,
                requestId,
                before,
                after: after ?? null,
                timestamp: new Date(),
                type: 'MongoDBFindOneAndUpdate',
                meta: connection.changeLog?.meta,
              },
              tenant,
            })
          );
        }
      } catch (error) {
        throw mapMongoError(error, { connection, requestType: 'MongoDBFindOneAndUpdate' });
      }
      await verifyStoredTenant({
        collection,
        connectionId,
        endpointId,
        ids: result.lastErrorObject?.upserted,
        requestId,
        requestType: 'MongoDBFindOneAndUpdate',
        tenant,
        tenantGuard,
      });
      return result.value ?? null;
    },
    async deleteOne(filter, options) {
      assertWrite('deleteOne');
      return run(MongoDBDeleteOne, { filter, options });
    },
    async deleteMany(filter, options) {
      assertWrite('deleteMany');
      return run(MongoDBDeleteMany, { filter, options });
    },
    async bulkWrite(operations, options) {
      assertWrite('bulkWrite');
      return run(MongoDBBulkWrite, { operations, options });
    },
  };
}

export default getWalledCollection;
