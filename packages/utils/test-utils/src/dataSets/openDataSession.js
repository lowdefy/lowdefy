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

import crypto from 'node:crypto';
import { threadId } from 'node:worker_threads';
import { type } from '@lowdefy/helpers';

import dataSessionRegistry from './dataSessionRegistry.js';
import drainSessionWork from './drainSessionWork.js';
import getDataStore from './getDataStore.js';
import groupDataSetByCollection from './groupDataSetByCollection.js';
import {
  dropDatabaseSets,
  forgetIdleDatabases,
  keepIdleDatabases,
  takeIdleDatabases,
} from './idleDatabases.js';
import isDataStoreGone from './isDataStoreGone.js';
import listSessionDatabases from './listSessionDatabases.js';
import loadDataSetCollection from './loadDataSetCollection.js';
import recordIndexes from './recordIndexes.js';
import releasePauseGates from './releasePauseGates.js';
import reloadDataSession from './reloadDataSession.js';
import sessionDatabaseName from './sessionDatabaseName.js';
import sweepOrphanDatabases from './sweepOrphanDatabases.js';

const DRAIN_TIMEOUT_MS = 30000;

async function dropSessionDatabases({ client, session }) {
  await Promise.all(
    listSessionDatabases({ session }).map((name) => client.db(name).dropDatabase())
  );
}

function createClose({ dataSet, session, store, logger }) {
  const { client } = store;
  let closing;
  async function close() {
    session.state = 'closing';
    // A routine held at a pause gate is let go, so a run that ended between a hold and its release
    // leaves nothing waiting on this session.
    releasePauseGates({ session });
    const drained = await drainSessionWork({ work: session.work, timeoutMs: DRAIN_TIMEOUT_MS });
    if (!drained) {
      logger.warn(
        `Data set "${session.name}": background work was still running ${
          DRAIN_TIMEOUT_MS / 1000
        } s after its journey ended. Dropping its databases anyway; that work now fails.`
      );
    }
    // Closed before the databases are kept or dropped: a connection read under this session
    // throws from here on, so nothing that outlived the drain reaches any database, and no target
    // is added after. Unregistering and keeping happen in one step, so a concurrent orphan sweep
    // never sees the databases unowned.
    session.state = 'closed';
    dataSessionRegistry.delete(session.id);
    // Work that outlived the wait, and a request still running (one whose journey failed or timed
    // out before it answered), may still hold a database and write to it, so their databases
    // never reach another session.
    if (drained && session.running.size === 0 && store.stopped !== true) {
      keepIdleDatabases({ dataSet, session, store });
      return;
    }
    await dropSessionDatabases({ client, session });
  }
  return function closeOnce() {
    closing = closing ?? close();
    return closing;
  };
}

// Loads a new set of databases with the data set, after dropping the databases no session owns.
async function loadDatabaseSet({ client, dataSet, perRun, session }) {
  await sweepOrphanDatabases({ client, perRun });
  // allSettled, so no collection is still loading when a failed load drops the databases.
  const results = await Promise.allSettled(
    groupDataSetByCollection({ dataSet }).map(async (group) => {
      const databaseName = sessionDatabaseName({ session, target: group.target });
      const indexes = await loadDataSetCollection({
        db: client.db(databaseName),
        dataSetName: dataSet.name,
        collectionName: group.collection,
        group,
      });
      recordIndexes({ session, databaseName, collectionName: group.collection, indexes });
    })
  );
  const failed = results.find((result) => result.status === 'rejected');
  if (!type.isUndefined(failed)) {
    throw failed.reason;
  }
}

// A new set of databases, under a prefix of its own: one per database target the build names,
// numbered in order, the first also the database a target computed per request reads.
function createDatabaseSet({ dataSet, perRun }) {
  const hex = crypto.randomBytes(6).toString('hex');
  const owner = threadId === 0 ? `p${process.pid}` : `p${process.pid}t${threadId}`;
  const prefix = perRun ? `ld_${owner}_${hex}` : `ld_${hex}`;
  const databaseTargets = dataSet.databaseTargets ?? [];
  return {
    prefix,
    databaseName: `${prefix}_0`,
    databases: new Map(databaseTargets.map((target, index) => [target, `${prefix}_${index}`])),
    databaseCount: Math.max(databaseTargets.length, 1),
    // The indexes each loaded collection holds, by database and collection (recordIndexes).
    loadedIndexes: new Map(),
  };
}

// An idle set of databases a closed session on the same data set left (idleDatabases), with the
// targets it numbered after open (a config mutant's) still in it, so a reset empties those too.
function reuseDatabaseSet(idle) {
  return {
    prefix: idle.prefix,
    databaseName: idle.databaseName,
    databases: idle.databases,
    databaseCount: idle.databaseCount,
    loadedIndexes: idle.loadedIndexes,
  };
}

// sunk is the session's own array, so requests sunk while the journey runs show in it.
function openedSession({ dataSet, logger, session, store }) {
  return {
    id: session.id,
    cookie: session.id,
    session,
    sunk: session.sunk,
    close: createClose({ dataSet, logger, session, store }),
  };
}

// Opens a data session for one journey run (or a mutant run): databases on the dev server's
// memory store, one per database target the build names (dataSet.databaseTargets), holding the
// data set and registered under a random id. They are named <prefix>_<n> under the session's own
// prefix (ld_<hex>), so the orphan sweep and close() find them all; the first, <prefix>_0, is also
// the database a target computed per request reads. `cookie` is the id, the payload
// openPage({ dataCookie }) writes into each actor's lowdefy_journey_data cookie, new for every
// session. close() releases its pause gates and waits for the session's background work
// (context.waitUntil). `logger` is the caller's own: close() warns on it when that work outlives
// the wait.
//
// A closed session's databases are kept for the next session on the same data set, which resets
// them (reloadDataSession) instead of loading a new set: creating and dropping databases is most
// of what a journey waits on. So the store holds one set per data set for every session open on
// it at once, never shared by two. A session whose background work outlived the wait drops its
// databases instead, as that work may still write to them, and so does a session closed while a
// request under it still runs (session.running). A run store's client drops its idle databases
// when it stops (a test app's close() stops it); the dev server's store takes them with it.
//
// `store` is a test run's store (getRunDataStore), which the endpoint test harness passes; the
// dev server passes none and gets its own (getDataStore). On a run's store the run's other test
// files hold sessions too, in other processes or in other worker threads of this one, so the
// prefix carries this process's pid and, in a worker thread, its thread id (ld_p<pid>_<hex>, or
// ld_p<pid>t<threadId>_<hex>), and the orphan sweep leaves the databases of processes still
// running and of other threads (sweepOrphanDatabases).
async function openDataSession({ dataSet, logger, store: runStore }) {
  const store = runStore ?? (await getDataStore({ logger }));
  const perRun = store.perRun === true;
  const { client, uri } = store;
  const id = crypto.randomBytes(16).toString('hex');
  // Taken in the same step as the session registers below, so no orphan sweep runs between.
  const { databases: idle, stale } = takeIdleDatabases({ dataSet, store });
  const session = {
    id,
    databaseUri: uri,
    ...(idle === undefined ? createDatabaseSet({ dataSet, perRun }) : reuseDatabaseSet(idle)),
    name: dataSet.name,
    // Registered while it loads, so a concurrent open's orphan sweep leaves its databases alone.
    // readDataSession serves only open and closing sessions.
    state: 'loading',
    work: new Set(),
    // The request resolver calls running under the session (createGatedResolver).
    running: new Set(),
    // Requests sunk instead of sent to an outside service (see sinkExternalConnections), and
    // stubbed requests.
    sunk: [],
    // Stand-in answers for outside requests, in order: the first that matches a request answers
    // it (createStubResolver).
    stubs: [],
    // Requests that throw a forced failure before they run (addFailGate).
    failGates: [],
    // Requests a routine is held at until the test releases it (addPauseGate).
    pauseGates: [],
    // Forced failures that reached the server's error sink, by the call they failed
    // (recordForcedFailure), so a check reads the message the client never sees.
    forced: [],
  };
  dataSessionRegistry.set(id, session);
  try {
    await dropDatabaseSets({ client, entries: stale });
    if (type.isUndefined(idle)) {
      await loadDatabaseSet({ client, dataSet, perRun, session });
    } else {
      await Promise.all([
        sweepOrphanDatabases({ client, perRun }),
        reloadDataSession({ client, dataSet, session }),
      ]);
    }
  } catch (error) {
    dataSessionRegistry.delete(id);
    if (isDataStoreGone(error)) {
      // mongod is gone, and every session on it with it. Stopping the store clears it, so the next
      // journey starts a fresh one instead of failing until the dev server restarts. Its idle
      // databases went with it, so they are forgotten, not dropped.
      forgetIdleDatabases({ store });
      await store.stop().catch(() => {});
      const message = perRun
        ? `The test data store stopped responding (${error.message}). The next session joins a new one.`
        : `The journey data store stopped responding (${error.message}). The next journey starts a new one.`;
      throw new Error(message, { cause: error });
    }
    // Best effort: the load error is the one to report, and the next open's orphan sweep drops a
    // database this could not.
    await dropSessionDatabases({ client, session }).catch(() => {});
    throw error;
  }
  session.state = 'open';
  return openedSession({ dataSet, logger, session, store });
}

export default openDataSession;
