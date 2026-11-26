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

import announceDataStoreDownload from './announceDataStoreDownload.js';
import connectToRunStore from './connectToRunStore.js';
import { dropIdleDatabases } from './idleDatabases.js';
import getRunOwnerPid from './getRunOwnerPid.js';
import getRunStoreRecordPath from './getRunStoreRecordPath.js';

const START_TIMEOUT_MS = 120000;
const DOWNLOAD_TIMEOUT_MS = 900000;

// The data store of a test run: one in-memory MongoDB replica set for every test process of the
// run, where the dev server's store (getDataStore) is one per server process. The first test
// process to ask starts it, in a keeper process of its own (runDataStoreKeeper), and the rest
// join it; each opens data sessions with databases of its own (openDataSession({ store })). It
// holds the same cache cap as the dev server's store (startDataStoreReplSet), and there is one
// per run however many test files run at once. It stops when the run's owner process is gone
// (the `node --test` runner, or this process when it has no runner above it or its runner is
// gone: getRunOwnerPid), or when no test process has used it for a while (runDataStoreKeeper).
// A record whose store does not answer is replaced, so the next join starts a new store.
//
// Returns this caller's own client on the store, with stop() to close it; the store stays up
// for the run's other test processes. `logger` is told when the MongoDB binary still has to be
// downloaded.
async function getRunDataStore({ logger }) {
  const downloading = await announceDataStoreDownload({ logger, purpose: 'endpoint tests' });
  const ownerPid = getRunOwnerPid();
  const { client, record } = await connectToRunStore({
    ownerPid,
    recordPath: getRunStoreRecordPath({ ownerPid }),
    timeoutMs: downloading ? DOWNLOAD_TIMEOUT_MS : START_TIMEOUT_MS,
  });
  const store = {
    client,
    keeperPid: record.keeperPid,
    perRun: true,
    stopped: false,
    uri: record.uri,
  };
  let stopping;
  store.stop = function stop() {
    stopping =
      stopping ??
      (async () => {
        // Stopped first, so a session closing meanwhile drops its own databases rather than keep
        // them, and the next session joins the run's store again. The store stays up for the
        // run's other test processes, so the databases this client kept idle are dropped, not
        // left for the run's end.
        store.stopped = true;
        await dropIdleDatabases({ store });
        await client.close().catch(() => {});
      })();
    return stopping;
  };
  return store;
}

export default getRunDataStore;
