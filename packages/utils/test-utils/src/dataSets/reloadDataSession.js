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

import groupDataSetByCollection from './groupDataSetByCollection.js';
import insertFixture from './insertFixture.js';
import insertGeneratedDocuments from './insertGeneratedDocuments.js';
import listSessionDatabases from './listSessionDatabases.js';
import loadDataSetCollection from './loadDataSetCollection.js';
import sessionDatabaseName from './sessionDatabaseName.js';

async function emptyDatabase({ db }) {
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const names = collections
    .filter((collection) => collection.type !== 'view' && !collection.name.startsWith('system.'))
    .map((collection) => collection.name);
  await Promise.all(names.map((name) => db.collection(name).deleteMany({})));
  return new Set(names);
}

// Puts a data session back to its data set, as it was when it opened: every collection in every
// database of the session is emptied, a collection a test made included, and the data set's
// documents are inserted again. Collections and their indexes are kept, since emptying and
// refilling one is several times cheaper than dropping the database and loading it anew; a
// collection of the data set that was dropped since is loaded as on open, indexes first.
async function reloadDataSession({ client, dataSet, session }) {
  const existing = new Map();
  await Promise.all(
    listSessionDatabases({ session }).map(async (databaseName) => {
      existing.set(databaseName, await emptyDatabase({ db: client.db(databaseName) }));
    })
  );
  await Promise.all(
    groupDataSetByCollection({ dataSet }).map(async (group) => {
      const databaseName = sessionDatabaseName({ session, target: group.target });
      const db = client.db(databaseName);
      if (existing.get(databaseName)?.has(group.collection) !== true) {
        await loadDataSetCollection({
          db,
          dataSetName: dataSet.name,
          collectionName: group.collection,
          group,
        });
        return;
      }
      const collection = db.collection(group.collection);
      for (const batch of group.generated) {
        await insertGeneratedDocuments({ collection, dataSetName: dataSet.name, batch });
      }
      for (const fixture of group.fixtures) {
        await insertFixture({ collection, dataSetName: dataSet.name, fixture });
      }
    })
  );
}

export default reloadDataSession;
