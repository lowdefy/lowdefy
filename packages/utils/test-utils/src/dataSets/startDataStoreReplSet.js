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

import { MongoMemoryReplSet } from 'mongodb-memory-server-core';

import pickDataStorePort from './pickDataStorePort.js';

// WiredTiger's cache otherwise grows to half of (RAM - 1 GB), several GB on a laptop. Data sets
// are small capped snapshots, so a quarter of a GB holds them.
const CACHE_SIZE_GB = '0.25';

// The mongod every data store runs on, the dev server's and a test run's alike, so both hold
// the same cache cap. A replica set, not a standalone server: transactions and change streams
// need one, and the app's own cluster is one. MONGOMS_VERSION, read by mongodb-memory-server,
// pins the MongoDB version.
async function startDataStoreReplSet() {
  return MongoMemoryReplSet.create({
    instanceOpts: [
      { port: await pickDataStorePort(), args: ['--wiredTigerCacheSizeGB', CACHE_SIZE_GB] },
    ],
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
}

export default startDataStoreReplSet;
