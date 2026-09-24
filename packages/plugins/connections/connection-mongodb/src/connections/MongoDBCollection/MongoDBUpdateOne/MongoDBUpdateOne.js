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

import applyTenantToFilter from '../tenant/applyTenantToFilter.js';
import applyTenantToUpdate from '../tenant/applyTenantToUpdate.js';
import stampTenantOnLogRecord from '../tenant/stampTenantOnLogRecord.js';
import getCollection from '../getCollection.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

async function MongodbUpdateOne({
  blockId,
  connection,
  connectionId,
  pageId,
  payload,
  request,
  requestId,
  tenant,
}) {
  const deserializedRequest = deserialize(request);
  const { options, disableNoMatchError } = deserializedRequest;
  let { filter, update } = deserializedRequest;
  if (tenant) {
    filter = applyTenantToFilter({ filter, tenant, position: 'a filter' });
    update = applyTenantToUpdate({ update, tenant, upsert: options?.upsert === true });
  }
  const { collection, logCollection } = await getCollection({ connection });
  let response;
  if (logCollection) {
    // findOneAndUpdate instead of updateOne to capture before and after
    // documents for the change log. The response shape matches the updateOne
    // response so it is invariant to the connection having a changeLog.
    let before;
    let result;
    try {
      before = await collection.findOne(filter);
      result = await collection.findOneAndUpdate(filter, update, {
        ...options,
        includeResultMetadata: true,
        returnDocument: 'after',
      });
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBUpdateOne' });
    }
    const after = result.value ?? null;
    const upsertedId = result.lastErrorObject?.upserted ?? null;
    const matched = result.lastErrorObject?.updatedExisting ? 1 : 0;
    response = {
      acknowledged: true,
      matchedCount: matched,
      modifiedCount: matched,
      upsertedId,
      upsertedCount: upsertedId ? 1 : 0,
    };
    // Throw before writing the log record so a no-match update never logs.
    // Not a driver error - a Lowdefy check, deliberately outside the mapping.
    if (!disableNoMatchError && !options?.upsert && matched === 0 && !upsertedId) {
      throw new Error('No matching record to update.');
    }
    try {
      await logCollection.insertOne(
        stampTenantOnLogRecord({
          record: {
            args: { filter, update, options },
            blockId,
            connectionId,
            pageId,
            payload,
            requestId,
            before,
            after,
            timestamp: new Date(),
            type: 'MongoDBUpdateOne',
            meta: connection.changeLog?.meta,
          },
          tenant,
        })
      );
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBUpdateOne' });
    }
  } else {
    try {
      response = await collection.updateOne(filter, update, options);
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBUpdateOne' });
    }
    // Not a driver error - a Lowdefy check, deliberately outside the mapping.
    if (!disableNoMatchError && !options?.upsert && response.matchedCount === 0) {
      throw new Error('No matching record to update.');
    }
  }
  return serialize(response);
}

MongodbUpdateOne.schema = schema;
MongodbUpdateOne.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongodbUpdateOne;
