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
import listSessionDatabases from './listSessionDatabases.js';
import loadDataSetCollection from './loadDataSetCollection.js';
import recordIndexNames from './recordIndexNames.js';
import seedDataSetCollection from './seedDataSetCollection.js';
import sessionDatabaseName from './sessionDatabaseName.js';

// What a collection the data set does not load holds when it is first written: the _id index.
const ID_INDEX_ONLY = new Set(['_id_']);

function hasIndexNames({ indexes, names }) {
  return indexes.length === names.size && indexes.every((index) => names.has(index.name));
}

// Empties every collection of one session database whose indexes are the ones it was loaded with
// (session.indexNames; only _id_ for a collection the data set does not load), and drops the rest:
// a collection that gained or lost an index (an app can create one at run time, as the auth
// adapter does), and a view or other collection that is not a plain one. Returns the names of the
// collections it kept.
async function emptyDatabase({ db, indexNames }) {
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const kept = new Set();
  await Promise.all(
    collections
      .filter((collection) => !collection.name.startsWith('system.'))
      .map(async ({ name, type }) => {
        if (type === 'collection') {
          const indexes = await db.collection(name).indexes();
          if (hasIndexNames({ indexes, names: indexNames?.get(name) ?? ID_INDEX_ONLY })) {
            await db.collection(name).deleteMany({});
            kept.add(name);
            return;
          }
        }
        await db.dropCollection(name);
      })
  );
  return kept;
}

// Puts a data session back to its data set, as it was when it opened, so nothing a test or
// journey wrote reaches the next one: no document, no collection it made with an index of its
// own, and no index it added. Each database of the session is emptied (emptyDatabase), and the
// data set's documents are written again, one bulk write per collection. Collections that keep
// their indexes are kept, since emptying and refilling one is several times cheaper than dropping
// the database and loading it anew; a collection of the data set that was dropped, here or by the
// test, is loaded as on open, indexes first.
async function reloadDataSession({ client, dataSet, session }) {
  const kept = new Map();
  await Promise.all(
    listSessionDatabases({ session }).map(async (databaseName) => {
      kept.set(
        databaseName,
        await emptyDatabase({
          db: client.db(databaseName),
          indexNames: session.indexNames.get(databaseName),
        })
      );
    })
  );
  await Promise.all(
    groupDataSetByCollection({ dataSet }).map(async (group) => {
      const databaseName = sessionDatabaseName({ session, target: group.target });
      const db = client.db(databaseName);
      if (kept.get(databaseName)?.has(group.collection) === true) {
        await seedDataSetCollection({
          collection: db.collection(group.collection),
          dataSetName: dataSet.name,
          group,
        });
        return;
      }
      const indexNames = await loadDataSetCollection({
        db,
        dataSetName: dataSet.name,
        collectionName: group.collection,
        group,
      });
      recordIndexNames({ session, databaseName, collectionName: group.collection, indexNames });
    })
  );
}

export default reloadDataSession;
