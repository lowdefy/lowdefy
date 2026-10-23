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

// One MongoDB server for the whole run, which every *.mongodb.test.mjs file reaches through
// MONGO_URL (set before the test workers start, so they inherit it). The same single-node replica
// set as @lowdefy/connection-mongodb's suite, so both share the downloaded binary.
let replSet;

export async function setup() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, dbName: 'test', storageEngine: 'wiredTiger' },
  });
  process.env.MONGO_URL = replSet.getUri();
}

export async function teardown() {
  await replSet.stop();
}
