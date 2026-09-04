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
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

// The consumer `collections.<name>.indexes` never had: a migration step that
// creates the declared indexes. `createIndexes` is idempotent for an index
// that already exists with the same key and options, which is what makes it
// safe inside a migration routine that may re-run after a mid-way failure.
//
// The indexes are named explicitly in the request rather than read from the
// collections: declaration, because the field contract the request layer
// threads to a resolver (collectionSchema) carries `fields` and `required`
// only, and a collection declaring indexes but no fields resolves to null. A
// migration therefore mirrors the declaration it is creating - the pair is
// visible in one diff, and the migration keeps working when the declaration
// later changes.
//
// There is deliberately no drop: an index this app no longer queries may be
// the one an external consumer depends on, and the failure the request exists
// to prevent is exactly an automated drop. Removing an index is a hand
// operation against the database.
//
// The tenant verdict is not applied: an index is a property of the collection,
// not of a row, so there is nothing to scope. The collections-index build
// check already folds the tenant field into the keys it suggests.
async function MongoDBCreateIndexes({ connection, request, trace }) {
  const { indexes } = deserialize(request);
  const specifications = indexes.map(({ keys, options }) => ({ key: keys, ...options }));
  if (trace) {
    trace.effective = serialize({ indexes: specifications });
  }
  const { collection } = await getCollection({ connection });
  let indexNames;
  try {
    indexNames = await collection.createIndexes(specifications);
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBCreateIndexes' });
  }
  return { indexNames };
}

MongoDBCreateIndexes.schema = schema;
MongoDBCreateIndexes.meta = {
  checkRead: false,
  checkWrite: true,
};

export default MongoDBCreateIndexes;
