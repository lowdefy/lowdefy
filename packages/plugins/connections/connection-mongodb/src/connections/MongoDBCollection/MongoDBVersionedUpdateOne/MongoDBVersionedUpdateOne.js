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

async function MongoDBVersionedUpdateOne({
  blockId,
  connection,
  connectionId,
  pageId,
  payload,
  request,
  requestId,
}) {
  const deserializedRequest = deserialize(request);
  const { filter, update, options, disableNoMatchError } = deserializedRequest;
  const { collection, logCollection } = await getCollection({ connection });
  const findOptions = options?.find;
  const insertOptions = options?.insert;
  const updateOptions = options?.update;

  // The matched document is re-inserted under a new _id so the previous
  // version is preserved, then the update is applied to the new copy.
  const document = await collection.findOne(filter, { ...findOptions });
  let insertedDocument;
  if (document) {
    delete document._id;
    insertedDocument = await collection.insertOne(document, { ...insertOptions });
  }

  let response;
  if (logCollection) {
    const result = await collection.findOneAndUpdate(
      insertedDocument ? { _id: insertedDocument.insertedId } : filter,
      update,
      {
        ...updateOptions,
        includeResultMetadata: true,
        returnDocument: 'after',
      }
    );
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
    if (!disableNoMatchError && !updateOptions?.upsert && matched === 0 && !upsertedId) {
      throw new Error('No matching record to update.');
    }
    await logCollection.insertOne({
      args: { filter, update, options },
      blockId,
      connectionId,
      pageId,
      payload,
      requestId,
      before: document,
      after,
      timestamp: new Date(),
      type: 'MongoDBVersionedUpdateOne',
      meta: connection.changeLog?.meta,
    });
  } else {
    response = await collection.updateOne(
      insertedDocument ? { _id: insertedDocument.insertedId } : filter,
      update,
      { ...updateOptions }
    );
    if (!disableNoMatchError && !updateOptions?.upsert && response.matchedCount === 0) {
      throw new Error('No matching record to update.');
    }
  }
  return serialize(response);
}

MongoDBVersionedUpdateOne.schema = schema;
MongoDBVersionedUpdateOne.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongoDBVersionedUpdateOne;
