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
import { type } from '@lowdefy/helpers';

import dataSessionRegistry from './dataSessionRegistry.js';
import drainSessionWork from './drainSessionWork.js';
import getDataStore from './getDataStore.js';
import groupDataSetByCollection from './groupDataSetByCollection.js';
import isDataStoreGone from './isDataStoreGone.js';
import loadDataSetCollection from './loadDataSetCollection.js';
import sessionDatabaseName from './sessionDatabaseName.js';
import sweepOrphanDatabases from './sweepOrphanDatabases.js';

const DRAIN_TIMEOUT_MS = 30000;

// Every database the session holds, the first included.
function listSessionDatabases(session) {
  return [...new Set([session.databaseName, ...session.databases.values()])];
}

async function dropSessionDatabases({ client, session }) {
  await Promise.all(listSessionDatabases(session).map((name) => client.db(name).dropDatabase()));
}

function createClose({ session, client }) {
  let closing;
  async function close() {
    session.state = 'closing';
    const drained = await drainSessionWork({ work: session.work, timeoutMs: DRAIN_TIMEOUT_MS });
    if (!drained) {
      // eslint-disable-next-line no-console
      console.warn(
        `Data set "${session.name}": background work was still running ${
          DRAIN_TIMEOUT_MS / 1000
        } s after its journey ended. Dropping its databases anyway; that work now fails.`
      );
    }
    // Closed before the drop: a connection read under this session throws from here on, so
    // nothing that outlived the drain reaches any database, and no target is added after the drop.
    session.state = 'closed';
    dataSessionRegistry.delete(session.id);
    await dropSessionDatabases({ client, session });
  }
  return function closeOnce() {
    closing = closing ?? close();
    return closing;
  };
}

// Opens a data session for one journey run (or a mutant run): fresh databases on the dev server's
// memory store, one per database target the build names (dataSet.databaseTargets), loaded with the
// data set and registered under a random id. They are named <prefix>_<n> under the session's own
// prefix (ld_<hex>), so the orphan sweep and close() find them all; the first, <prefix>_0, is also
// the database a target computed per request reads. `cookie` is the id, the payload
// openPage({ dataCookie }) writes into each actor's lowdefy_journey_data cookie. close() waits for
// the session's background work (context.waitUntil), then drops the databases.
async function openDataSession({ dataSet }) {
  const store = await getDataStore();
  const { client, uri } = store;
  const id = crypto.randomBytes(16).toString('hex');
  const prefix = `ld_${crypto.randomBytes(6).toString('hex')}`;
  const databaseTargets = dataSet.databaseTargets ?? [];
  const session = {
    id,
    databaseUri: uri,
    prefix,
    databaseName: `${prefix}_0`,
    databases: new Map(databaseTargets.map((target, index) => [target, `${prefix}_${index}`])),
    databaseCount: Math.max(databaseTargets.length, 1),
    name: dataSet.name,
    // Registered while it loads, so a concurrent open's orphan sweep leaves its databases alone.
    // readDataSession serves only open and closing sessions.
    state: 'loading',
    work: new Set(),
    // Requests sunk instead of sent to an outside service (see sinkExternalConnections).
    sunk: [],
  };
  dataSessionRegistry.set(id, session);
  try {
    await sweepOrphanDatabases({ client });
    const groups = groupDataSetByCollection({ dataSet });
    // allSettled, so no collection is still loading when a failed load drops the databases.
    const results = await Promise.allSettled(
      groups.map((group) =>
        loadDataSetCollection({
          db: client.db(sessionDatabaseName({ session, target: group.target })),
          dataSetName: dataSet.name,
          collectionName: group.collection,
          group,
        })
      )
    );
    const failed = results.find((result) => result.status === 'rejected');
    if (!type.isUndefined(failed)) {
      throw failed.reason;
    }
  } catch (error) {
    dataSessionRegistry.delete(id);
    if (isDataStoreGone(error)) {
      // mongod is gone, and every session on it with it. Stopping the store clears it, so the next
      // journey starts a fresh one instead of failing until the dev server restarts.
      await store.stop().catch(() => {});
      throw new Error(
        `The journey data store stopped responding (${error.message}). The next journey starts a new one.`,
        { cause: error }
      );
    }
    // Best effort: the load error is the one to report, and the next open's orphan sweep drops a
    // database this could not.
    await dropSessionDatabases({ client, session }).catch(() => {});
    throw error;
  }
  session.state = 'open';
  // sunk is the session's own array, so requests sunk while the journey runs show in it.
  return { id, cookie: id, session, sunk: session.sunk, close: createClose({ session, client }) };
}

export default openDataSession;
