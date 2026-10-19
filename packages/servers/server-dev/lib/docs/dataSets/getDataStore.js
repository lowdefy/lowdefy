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
import { MongoMemoryReplSet } from 'mongodb-memory-server-core';
import { DryMongoBinary } from 'mongodb-memory-server-core/lib/util/DryMongoBinary.js';

import pickDataStorePort from './pickDataStorePort.js';
import registerDataStoreShutdown from './registerDataStoreShutdown.js';
import removeDataStoreFiles from './removeDataStoreFiles.js';

// One store per dev server process. Kept on globalThis because the journey route that opens a data
// session and the API context that reads it may load as separate module instances (Vite's SSR
// module graph and Node's), like the journey actor token.
const STORE_KEY = Symbol.for('lowdefy.devServer.dataStore');

// The store is a local mongod: a client that cannot reach it within this long is looking at a dead
// store, and the journey should say so rather than wait the driver's default 30 s.
const SERVER_SELECTION_TIMEOUT_MS = 5000;

async function announceDownload() {
  const options = await DryMongoBinary.generateOptions();
  const binary = await DryMongoBinary.locateBinary(options);
  if (binary === undefined) {
    // eslint-disable-next-line no-console
    console.info(`Downloading MongoDB ${options.version} for journey data sets (once).`);
  }
}

// A replica set, not a standalone server: transactions and change streams need one, and the app's
// own cluster is one. MONGOMS_VERSION, read by mongodb-memory-server, pins the MongoDB version.
async function startDataStore() {
  await announceDownload();
  const replSet = await MongoMemoryReplSet.create({
    instanceOpts: [{ port: await pickDataStorePort() }],
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const uri = replSet.getUri();
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
  try {
    await client.connect();
  } catch (error) {
    await replSet.stop({ doCleanup: true });
    throw error;
  }
  // Past the awaits above, getDataStore has cached the promise this call returned.
  const storePromise = globalThis[STORE_KEY];
  let unregisterShutdown;
  let stopping;
  // Stops mongod and removes its temporary database directory. A later getDataStore() starts a new
  // store; the cache is cleared only while it still holds this one.
  function stop() {
    stopping =
      stopping ??
      (async () => {
        if (globalThis[STORE_KEY] === storePromise) {
          delete globalThis[STORE_KEY];
        }
        await client.close().catch(() => {});
        // stop() skips or fails its cleanup when mongod has already died, which is when this store
        // most needs it: its directory may still hold a session's rows.
        try {
          await replSet.stop({ doCleanup: true });
        } finally {
          removeDataStoreFiles({ replSet });
          // Kept until the files are gone: Vite's SIGTERM handler can exit the process mid-stop,
          // and the exit hook then finishes the removal.
          unregisterShutdown();
        }
      })();
    return stopping;
  }
  unregisterShutdown = registerDataStoreShutdown({ replSet, stop });
  return { client, uri, stop };
}

// The in-memory MongoDB replica set journey data sessions load into, started on first use. There
// is no idle stop: an idle store holds no session databases, and a restart would land on a new port
// while the connection plugin's cached clients keep polling the old one. It stops, with its
// temporary directory removed, when the dev server process shuts down. A failed start is not
// cached, so the next call tries again, and a store found dead (openDataSession) is stopped, so the
// next call starts a fresh one.
function getDataStore() {
  if (globalThis[STORE_KEY] === undefined) {
    globalThis[STORE_KEY] = startDataStore().catch((error) => {
      delete globalThis[STORE_KEY];
      throw error;
    });
  }
  return globalThis[STORE_KEY];
}

export default getDataStore;
