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

import fs from 'node:fs';

import isProcessAlive from './isProcessAlive.js';
import readRunStoreRecord from './readRunStoreRecord.js';
import removeDataStoreFiles from './removeDataStoreFiles.js';
import startDataStoreReplSet from './startDataStoreReplSet.js';
import writeRunStoreRecord from './writeRunStoreRecord.js';

const OWNER_POLL_MS = 250;
const STOP_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'];

// Holds one test run's data store: starts mongod, publishes its URI in the run's record, and
// stops it, with its temporary directory and the record removed, once the owner process is
// gone. The owner is watched by pid, so the store goes whether the runner finished, was
// interrupted or was killed: a killed runner runs no handler of its own. The keeper is in a
// process group of its own, so a terminal's Ctrl+C reaches it only as the owner's exit. If the
// keeper itself is killed, mongodb-memory-server's own helper process stops mongod.
//
// The record must still carry this keeper's claim token, at start and on every poll: a record
// that was replaced belongs to another keeper, and this one stops.
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

  let stopping;
  function stop() {
    stopping =
      stopping ??
      (async () => {
        if (holdsRecord()) {
          fs.rmSync(recordPath, { force: true });
        }
        try {
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

  setInterval(() => {
    if (!isProcessAlive({ pid: ownerPid }) || !holdsRecord()) {
      stopAndExit();
    }
  }, OWNER_POLL_MS);
}

export default runDataStoreKeeper;
