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
import validateDocFields from '../collectionSchema/validateDocFields.js';
import validateUpdateFields from '../collectionSchema/validateUpdateFields.js';
import getCollection from '../getCollection.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

async function MongoDBVersionedUpdateOne({
  blockId,
  collectionSchema,
  connection,
  connectionId,
  pageId,
  payload,
  request,
  requestId,
  tenant,
  trace,
}) {
  const deserializedRequest = deserialize(request);
  const { options, disableNoMatchError } = deserializedRequest;
  let { filter, update } = deserializedRequest;
  const findOptions = options?.find;
  const insertOptions = options?.insert;
  const updateOptions = options?.update;
  if (tenant) {
    filter = applyTenantToFilter({ filter, tenant, position: 'a filter', trace });
    update = applyTenantToUpdate({
      update,
      tenant,
      upsert: updateOptions?.upsert === true,
      trace,
    });
  }
  if (collectionSchema) {
    validateUpdateFields({ update, collectionSchema, filter, options: updateOptions });
  }
  if (trace) {
    trace.effective = serialize({ filter, update, options });
  }
  const { collection, logCollection } = await getCollection({ connection });

  // The matched document is re-inserted under a new _id so the previous
  // version is preserved, then the update is applied to the new copy.
  let document;
  try {
    document = await collection.findOne(filter, { ...findOptions });
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBVersionedUpdateOne' });
  }
  let insertedDocument;
  if (document) {
    delete document._id;
    if (tenant) {
      // The copy came through the walled read, so it belongs to the caller's
      // org and already carries the field - the direct set (no authored-value
      // scan, which would reject the field the document legitimately holds)
      // keeps the version copy stamped by construction rather than by trust.
      document[tenant.field] = tenant.value;
    }
    if (collectionSchema) {
      validateDocFields({ doc: document, collectionSchema, position: 'a version copy' });
    }
    try {
      insertedDocument = await collection.insertOne(document, { ...insertOptions });
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBVersionedUpdateOne' });
    }
  }

  let response;
  if (logCollection) {
    let result;
    try {
      result = await collection.findOneAndUpdate(
        insertedDocument ? { _id: insertedDocument.insertedId } : filter,
        update,
        {
          ...updateOptions,
          includeResultMetadata: true,
          returnDocument: 'after',
        }
      );
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBVersionedUpdateOne' });
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
    if (!disableNoMatchError && !updateOptions?.upsert && matched === 0 && !upsertedId) {
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
            before: document,
            after,
            timestamp: new Date(),
            type: 'MongoDBVersionedUpdateOne',
            meta: connection.changeLog?.meta,
          },
          tenant,
        })
      );
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBVersionedUpdateOne' });
    }
  } else {
    try {
      response = await collection.updateOne(
        insertedDocument ? { _id: insertedDocument.insertedId } : filter,
        update,
        { ...updateOptions }
      );
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBVersionedUpdateOne' });
    }
    // Not a driver error - a Lowdefy check, deliberately outside the mapping.
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
