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
import loadSnapshot from './loadSnapshot.js';
import sweepOrphanDatabases from './sweepOrphanDatabases.js';

const DRAIN_TIMEOUT_MS = 30000;

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
        } s after its journey ended. Dropping its database anyway; that work now fails.`
      );
    }
    // Closed before the drop: a connection read under this session throws from here on, so
    // nothing that outlived the drain reaches any database.
    session.state = 'closed';
    dataSessionRegistry.delete(session.id);
    await client.db(session.databaseName).dropDatabase();
  }
  return function closeOnce() {
    closing = closing ?? close();
    return closing;
  };
}

// Opens a data session for one journey run (or a walk, or a mutant run): a fresh database on the dev
// server's memory store, loaded with the data set, registered under a random id. `cookie` is that id,
// the payload openPage({ dataCookie }) writes into each actor's lowdefy_journey_data cookie. close()
// waits for the session's background work (context.waitUntil), then drops the database.
async function openDataSession({ dataSet }) {
  const store = await getDataStore();
  const { client, uri } = store;
  const id = crypto.randomBytes(16).toString('hex');
  const session = {
    id,
    databaseUri: uri,
    databaseName: `ld_${crypto.randomBytes(6).toString('hex')}`,
    name: dataSet.name,
    // Registered while it loads, so a concurrent open's orphan sweep leaves its database alone.
    // readDataSession serves only open and closing sessions.
    state: 'loading',
    work: new Set(),
  };
  dataSessionRegistry.set(id, session);
  try {
    await sweepOrphanDatabases({ client });
    const snapshotDocuments = type.isNone(dataSet.snapshot)
      ? {}
      : await loadSnapshot({
          configDirectory: dataSet.configDirectory,
          name: dataSet.name,
          manifest: dataSet.snapshot,
        });
    const db = client.db(session.databaseName);
    const groups = groupDataSetByCollection({ dataSet });
    // allSettled, so no collection is still loading when a failed load drops the database.
    const results = await Promise.allSettled(
      Object.entries(groups).map(([collectionName, group]) =>
        loadDataSetCollection({
          db,
          dataSetName: dataSet.name,
          collectionName,
          group,
          documents: snapshotDocuments[collectionName] ?? [],
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
    await client
      .db(session.databaseName)
      .dropDatabase()
      .catch(() => {});
    throw error;
  }
  session.state = 'open';
  return { id, cookie: id, session, close: createClose({ session, client }) };
}

export default openDataSession;
