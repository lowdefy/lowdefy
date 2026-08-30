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
import stampTenantOnDoc from '../tenant/stampTenantOnDoc.js';
import stampTenantOnLogRecord from '../tenant/stampTenantOnLogRecord.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

async function MongodbInsertMany({
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
  let { docs } = deserializedRequest;
  if (tenant) {
    docs = docs.map((doc) => stampTenantOnDoc({ doc, tenant }));
  }
  const { collection, logCollection } = await getCollection({ connection });
  let response;
  try {
    response = await collection.insertMany(docs, options);
    if (logCollection) {
      await logCollection.insertOne(
        stampTenantOnLogRecord({
          record: {
            args: { docs, options },
            blockId,
            connectionId,
            pageId,
            payload,
            requestId,
            response,
            timestamp: new Date(),
            type: 'MongoDBInsertMany',
            meta: connection.changeLog?.meta,
          },
          tenant,
        })
      );
    }
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBInsertMany' });
  }
  const { acknowledged, insertedCount, insertedIds } = serialize(response);
  return { acknowledged, insertedCount, insertedIds };
}

MongodbInsertMany.schema = schema;
MongodbInsertMany.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongodbInsertMany;
