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
import { setTimeout as sleep } from 'node:timers/promises';

import { type } from '@lowdefy/helpers';

import claimRunStore from './claimRunStore.js';
import isProcessAlive from './isProcessAlive.js';
import readRunStoreRecord from './readRunStoreRecord.js';
import spawnDataStoreKeeper from './spawnDataStoreKeeper.js';

const POLL_MS = 50;

// A record whose keeper is gone describes a store that no longer exists: left by a keeper that
// was killed, or by an earlier run whose owner had this pid. Before the keeper has written its
// pid, the process that claimed the record stands in for it.
function isStale(record) {
  const holderPid = record.keeperPid ?? record.starterPid;
  return !isProcessAlive({ pid: holderPid });
}

// Waits for the run's data store and returns its record ({ uri, keeperPid }). The first test
// process to arrive claims the record and starts the keeper; the rest find the claim and wait
// for the URI. A stale record is removed and claimed again.
async function waitForRunStoreRecord({ ownerPid, recordPath, timeoutMs }) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const record = readRunStoreRecord({ recordPath });
    if (type.isNone(record)) {
      const token = claimRunStore({ ownerPid, recordPath });
      if (!type.isNone(token)) {
        spawnDataStoreKeeper({ ownerPid, recordPath, token });
      }
    } else if (isStale(record)) {
      fs.rmSync(recordPath, { force: true });
    } else if (!type.isNone(record.error)) {
      fs.rmSync(recordPath, { force: true });
      throw new Error(`The test data store could not start: ${record.error}`);
    } else if (type.isString(record.uri)) {
      return record;
    }
    await sleep(POLL_MS);
  }
  throw new Error(
    `The test data store did not start within ${Math.round(
      timeoutMs / 1000
    )} s. Its record is "${recordPath}".`
  );
}

export default waitForRunStoreRecord;
