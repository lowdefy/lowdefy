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

import { BSON } from 'mongodb';
import { type } from '@lowdefy/helpers';

function cleanIndex(index) {
  const { v, ns, ...rest } = index;
  return rest;
}

async function readIndexes({ collection }) {
  try {
    const indexes = await collection.listIndexes().toArray();
    return indexes.filter((index) => index.name !== '_id_').map(cleanIndex);
  } catch (error) {
    // NamespaceNotFound: the collection does not exist in the source yet.
    if (error.code === 26) return [];
    throw error;
  }
}

async function findDocuments({ collection, connection }) {
  let filter = {};
  if (!type.isNone(connection.scope)) {
    // Scope applies only to collections that carry the field; shared content without it is copied
    // up to the limit.
    const scoped = await collection.findOne(
      { [connection.scope.field]: { $exists: true } },
      { projection: { _id: 1 } }
    );
    if (!type.isNone(scoped)) {
      filter = { [connection.scope.field]: { $in: connection.scope.values } };
    }
  }
  const options = { sort: connection.sort, limit: connection.limit };
  // Omitted fields go into the projection, so they never leave the database.
  if (connection.omit.length > 0) {
    options.projection = Object.fromEntries(connection.omit.map((field) => [field, 0]));
  }
  return collection.find(filter, options).toArray();
}

// Reads one collection for every listed connection that names it, read-only: findOne, find and
// listIndexes. Documents read by more than one connection are kept once.
async function readSnapshotCollection({ db, collectionName, connections }) {
  const collection = db.collection(collectionName);
  const documents = [];
  const seen = new Set();
  for (const connection of connections) {
    const found = await findDocuments({ collection, connection });
    found.forEach((document) => {
      const key = BSON.EJSON.stringify(document._id, { relaxed: false });
      if (seen.has(key)) return;
      seen.add(key);
      documents.push(document);
    });
  }
  const indexes = await readIndexes({ collection });
  return { documents, indexes };
}

export default readSnapshotCollection;
