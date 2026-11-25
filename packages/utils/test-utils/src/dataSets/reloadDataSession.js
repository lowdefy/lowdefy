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

import { type } from '@lowdefy/helpers';

import describeIndexes from './describeIndexes.js';
import groupDataSetByCollection from './groupDataSetByCollection.js';
import listSessionDatabases from './listSessionDatabases.js';
import loadDataSetCollection from './loadDataSetCollection.js';
import recordIndexes from './recordIndexes.js';
import seedDataSetCollection from './seedDataSetCollection.js';
import sessionDatabaseName from './sessionDatabaseName.js';

// Whether a collection holds what it held when the session loaded it: no options (a validator,
// a collation, capped), and the indexes recorded at load (recordIndexes), or only the _id index
// for a collection the data set does not load.
function isAsLoaded({ indexes, loaded, options }) {
  if (Object.keys(options ?? {}).length > 0) return false;
  if (type.isUndefined(loaded)) {
    return indexes.length === 1 && indexes[0].name === '_id_';
  }
  return describeIndexes(indexes) === loaded;
}

// Empties every collection of one session database that is as it was loaded (isAsLoaded), and
// drops the rest: a collection that gained or lost an index or an option (an app can create an
// index at run time, as the auth adapter does), and a view or other collection that is not a
// plain one. Returns the names of the collections it kept.
async function emptyDatabase({ db, loadedIndexes }) {
  const collections = await db.listCollections().toArray();
  const kept = new Set();
  await Promise.all(
    collections
      .filter((collection) => !collection.name.startsWith('system.'))
      .map(async ({ name, options, type: kind }) => {
        if (kind === 'collection') {
          const indexes = await db.collection(name).indexes();
          if (isAsLoaded({ indexes, loaded: loadedIndexes?.get(name), options })) {
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
          loadedIndexes: session.loadedIndexes.get(databaseName),
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
      const indexes = await loadDataSetCollection({
        db,
        dataSetName: dataSet.name,
        collectionName: group.collection,
        group,
      });
      recordIndexes({ session, databaseName, collectionName: group.collection, indexes });
    })
  );
}

export default reloadDataSession;
