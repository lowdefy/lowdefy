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
import stampTenantOnLogRecord from '../tenant/stampTenantOnLogRecord.js';
import getCollection from '../getCollection.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

async function MongodbDeleteOne({
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
  const { options } = deserializedRequest;
  let { filter } = deserializedRequest;
  if (tenant) {
    filter = applyTenantToFilter({ filter, tenant, position: 'a filter' });
  }
  const { collection, logCollection } = await getCollection({ connection });
  let response;
  try {
    if (logCollection) {
      // findOneAndDelete instead of deleteOne to capture the deleted document
      // for the change log. The response shape matches the deleteOne response.
      const result = await collection.findOneAndDelete(filter, {
        ...options,
        includeResultMetadata: true,
      });
      const before = result.value ?? null;
      response = {
        acknowledged: true,
        deletedCount: result.lastErrorObject?.n ?? 0,
      };
      await logCollection.insertOne(
        stampTenantOnLogRecord({
          record: {
            args: { filter, options },
            blockId,
            connectionId,
            pageId,
            payload,
            requestId,
            before,
            timestamp: new Date(),
            type: 'MongoDBDeleteOne',
            meta: connection.changeLog?.meta,
          },
          tenant,
        })
      );
    } else {
      response = await collection.deleteOne(filter, options);
    }
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBDeleteOne' });
  }
  return serialize(response);
}

MongodbDeleteOne.schema = schema;
MongodbDeleteOne.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongodbDeleteOne;
