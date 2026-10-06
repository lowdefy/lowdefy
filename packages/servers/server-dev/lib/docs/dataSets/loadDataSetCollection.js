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

import insertFixture from './insertFixture.js';
import mergeCollectionIndexes from './mergeCollectionIndexes.js';

// Loads one collection into a fresh session database: indexes first, on the empty collection, so a
// fixture that breaks a unique index fails here instead of loading; then the fixtures.
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
  for (const fixture of group.fixtures) {
    await insertFixture({ collection, dataSetName, fixture });
  }
}

export default loadDataSetCollection;
