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

async function MongodbDeleteMany({
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
    response = await collection.deleteMany(filter, options);
    if (logCollection) {
      await logCollection.insertOne(
        stampTenantOnLogRecord({
          record: {
            args: { filter, options },
            blockId,
            connectionId,
            pageId,
            payload,
            requestId,
            response,
            timestamp: new Date(),
            type: 'MongoDBDeleteMany',
            meta: connection.changeLog?.meta,
          },
          tenant,
        })
      );
    }
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBDeleteMany' });
  }
  const { acknowledged, deletedCount } = serialize(response);
  return { acknowledged, deletedCount };
}

MongodbDeleteMany.schema = schema;
MongodbDeleteMany.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongodbDeleteMany;
