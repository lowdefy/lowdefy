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

import { MongoClient } from 'mongodb';

import countStoreClients from './countStoreClients.js';
import isProcessAlive from './isProcessAlive.js';
import readRunStoreRecord from './readRunStoreRecord.js';
import removeDataStoreFiles from './removeDataStoreFiles.js';
import removeRunStoreRecord from './removeRunStoreRecord.js';
import startDataStoreReplSet from './startDataStoreReplSet.js';
import writeRunStoreRecord from './writeRunStoreRecord.js';

const OWNER_POLL_MS = 250;
const CLIENT_POLL_MS = 1000;
const IDLE_STOP_MS = 30000;
const KEEPER_APP_NAME = 'lowdefy-test-store-keeper';
const SERVER_SELECTION_TIMEOUT_MS = 5000;
const STOP_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'];

// Holds one test run's data store: starts mongod, publishes its URI in the run's record, and
// stops it, with its temporary directory and the record removed, once the run is over. Two
// things end a run, whichever comes first:
//
// - The owner process is gone. The owner is watched by pid, so the store goes as soon as the
//   runner finishes, is interrupted or is killed: a killed runner runs no handler of its own.
// - No test process has used the store for IDLE_STOP_MS. This holds whatever the owner pid
//   says, so a store whose owner never exits (a process that adopted an orphaned test file)
//   still stops. The keeper counts the store's clients other than its own every
//   CLIENT_POLL_MS. Once it has been idle long enough, it removes its record first, so no new
//   test process joins, and stops mongod at the next poll with no client. A process that read
//   the record just before keeps the store up until it leaves; a later one finds no record
//   and starts a new store through the claim.
//
// A store mongod no longer answers on is stopped too. The keeper is in a process group of its
// own, so a terminal's Ctrl+C reaches it only as the owner's exit. If the keeper itself is
// killed, mongodb-memory-server's own helper process stops mongod.
//
// The record must still carry this keeper's claim token, at start and on every poll until it
// lets the record go: a record that was replaced belongs to another keeper, and this one stops.
async function runDataStoreKeeper({ ownerPid, recordPath, token }) {
  function holdsRecord() {
    return readRunStoreRecord({ recordPath })?.token === token;
  }
  if (!holdsRecord()) {
    return;
  }
  const record = { ownerPid, keeperPid: process.pid, token, uri: null };
  writeRunStoreRecord({ recordPath, record });

  let replSet;
  try {
    replSet = await startDataStoreReplSet();
  } catch (error) {
    // The test processes waiting on the record read why there is no store.
    writeRunStoreRecord({ recordPath, record: { ...record, error: error.message } });
    process.exitCode = 1;
    return;
  }
  const client = new MongoClient(replSet.getUri(), {
    appName: KEEPER_APP_NAME,
    serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  });

  let stopping;
  function stop() {
    stopping =
      stopping ??
      (async () => {
        removeRunStoreRecord({ recordPath, token });
        try {
          await client.close().catch(() => {});
          await replSet.stop({ doCleanup: true });
        } finally {
          removeDataStoreFiles({ replSet });
        }
      })();
    return stopping;
  }
  async function stopAndExit() {
    try {
      await stop();
    } finally {
      process.exit(0);
    }
  }
  STOP_SIGNALS.forEach((signal) => process.once(signal, stopAndExit));
  // A last resort for an exit that ran no stop: kill mongod and remove its directory.
  process.once('exit', () => removeDataStoreFiles({ replSet }));

  if (!holdsRecord()) {
    await stopAndExit();
    return;
  }
  writeRunStoreRecord({ recordPath, record: { ...record, uri: replSet.getUri() } });

  let releasedRecord = false;
  let lastUsedAt = Date.now();
  let checkingClients = false;
  async function checkClients() {
    let clients;
    try {
      clients = await countStoreClients({ client, keeperAppName: KEEPER_APP_NAME });
    } catch {
      // mongod does not answer: the store is gone for every test process.
      await stopAndExit();
      return;
    }
    if (clients > 0) {
      lastUsedAt = Date.now();
    } else if (releasedRecord) {
      await stopAndExit();
    } else if (Date.now() - lastUsedAt >= IDLE_STOP_MS) {
      removeRunStoreRecord({ recordPath, token });
      releasedRecord = true;
    }
  }

  setInterval(() => {
    if (!isProcessAlive({ pid: ownerPid }) || (!releasedRecord && !holdsRecord())) {
      stopAndExit();
    }
  }, OWNER_POLL_MS);
  setInterval(async () => {
    if (checkingClients) return;
    checkingClients = true;
    try {
      await checkClients();
    } finally {
      checkingClients = false;
    }
  }, CLIENT_POLL_MS);
}

export { IDLE_STOP_MS };
export default runDataStoreKeeper;
