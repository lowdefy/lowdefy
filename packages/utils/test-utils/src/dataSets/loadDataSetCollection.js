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

import describeIndexes from './describeIndexes.js';
import mergeCollectionIndexes from './mergeCollectionIndexes.js';
import seedDataSetCollection from './seedDataSetCollection.js';

// Loads one collection into a session database it is not in yet: indexes first, on the empty
// collection, so a document that breaks a unique index fails here instead of loading; then the
// generated documents and the fixtures, in one bulk write. Returns the indexes the collection
// holds, _id_ included (describeIndexes), which a reset checks it against (reloadDataSession).
async function loadDataSetCollection({ db, dataSetName, collectionName, group }) {
  const collection = await db.createCollection(collectionName);
  const indexes = mergeCollectionIndexes({
    dataSetName,
    collection: collectionName,
    indexes: group.indexes,
  });
  if (indexes.length > 0) {
    await collection.createIndexes(indexes);
  }
  await seedDataSetCollection({ collection, dataSetName, group });
  return describeIndexes(await collection.indexes());
}

export default loadDataSetCollection;
