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

import listSessionDatabases from './listSessionDatabases.js';

// The databases of closed data sessions, kept loaded for the next session on the same data set
// (openDataSession): resetting them is several times cheaper than dropping them and loading a new
// set. One entry per set of databases, each on one store, and an entry is taken out while a
// session uses it, so two sessions open at once never share databases. On globalThis for the
// reason the session registry is (dataSessionRegistry): the orphan sweep must see every entry of
// this process, whichever module instance kept it. A worker thread has its own.
const POOL_KEY = Symbol.for('lowdefy.dataSets.idleDatabases');
globalThis[POOL_KEY] ??= new Set();

const idleDatabases = globalThis[POOL_KEY];

// Two data sets with the same layout load the same databases, collections and indexes, so one's
// databases take the other's documents with a reset. The documents are left out: a reset writes
// the data set's documents anew, and on the dev server an edit to them keeps the layout.
function layoutKey({ dataSet }) {
  return JSON.stringify([
    dataSet.name,
    dataSet.databaseTargets ?? [],
    dataSet.targets ?? {},
    dataSet.collections,
    dataSet.indexes,
  ]);
}

// Takes the idle databases a new session on `dataSet` can reset, if any. Entries of the same data
// set with another layout (one edited on the dev server since) are taken out too, as `stale`, for
// the caller to drop: no later session on that data set can use them.
function takeIdleDatabases({ dataSet, store }) {
  const key = layoutKey({ dataSet });
  let databases;
  const stale = [];
  for (const entry of idleDatabases) {
    if (entry.store !== store || entry.name !== dataSet.name) continue;
    if (entry.key !== key) {
      idleDatabases.delete(entry);
      stale.push(entry);
      continue;
    }
    if (type.isUndefined(databases)) {
      idleDatabases.delete(entry);
      databases = entry;
    }
  }
  return { databases, stale };
}

// Keeps a closed session's databases for the next session on its data set.
function keepIdleDatabases({ dataSet, session, store }) {
  idleDatabases.add({
    store,
    key: layoutKey({ dataSet }),
    name: dataSet.name,
    prefix: session.prefix,
    databaseName: session.databaseName,
    databases: session.databases,
    databaseCount: session.databaseCount,
    indexNames: session.indexNames,
  });
}

// The prefixes of every idle set of databases in this process, which the orphan sweep leaves.
function listIdlePrefixes() {
  return [...idleDatabases].map((entry) => entry.prefix);
}

// Forgets a store's idle databases, as the store stops: they go with it.
function forgetIdleDatabases({ store }) {
  for (const entry of idleDatabases) {
    if (entry.store === store) idleDatabases.delete(entry);
  }
}

// Drops sets of databases taken out of the pool, best effort: a database a drop misses is
// unowned, so the next fresh session's orphan sweep drops it.
async function dropDatabaseSets({ client, entries }) {
  await Promise.allSettled(
    entries.flatMap((entry) =>
      listSessionDatabases({ session: entry }).map((name) => client.db(name).dropDatabase())
    )
  );
}

// Drops a store's idle databases, as a test app lets go of its client on a run's store, which
// stays up for the run's other test files.
async function dropIdleDatabases({ store }) {
  const entries = [...idleDatabases].filter((entry) => entry.store === store);
  entries.forEach((entry) => idleDatabases.delete(entry));
  await dropDatabaseSets({ client: store.client, entries });
}

export {
  dropDatabaseSets,
  dropIdleDatabases,
  forgetIdleDatabases,
  keepIdleDatabases,
  listIdlePrefixes,
  takeIdleDatabases,
};
