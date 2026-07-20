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
}) {
  const deserializedRequest = deserialize(request);
  const { filter, options } = deserializedRequest;
  const { collection, logCollection } = await getCollection({ connection });
  let response;
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
    await logCollection.insertOne({
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
    });
  } else {
    response = await collection.deleteOne(filter, options);
  }
  return serialize(response);
}

MongodbDeleteOne.schema = schema;
MongodbDeleteOne.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongodbDeleteOne;
