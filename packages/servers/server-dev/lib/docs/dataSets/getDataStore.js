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

// One store per dev server process. Kept on globalThis because the journey route that opens a data
// session and the API context that reads it may load as separate module instances (Vite's SSR
// module graph and Node's), like the journey actor token.
const STORE_KEY = Symbol.for('lowdefy.devServer.dataStore');

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
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const uri = replSet.getUri();
  const client = new MongoClient(uri);
  try {
    await client.connect();
  } catch (error) {
    await replSet.stop();
    throw error;
  }
  async function stop() {
    await client.close();
    await replSet.stop();
    delete globalThis[STORE_KEY];
  }
  return { client, uri, stop };
}

// The in-memory MongoDB replica set journey data sessions load into, started on first use. There
// is no idle stop: an idle store holds no session databases, and a restart would land on a new port
// while the connection plugin's cached clients keep polling the old one. mongodb-memory-server's
// own killer process stops mongod when the dev server exits. A failed start is not cached, so the
// next call tries again.
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
