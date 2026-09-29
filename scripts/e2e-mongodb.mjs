#!/usr/bin/env node
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

/*
  Start a fresh single-node MongoDB replica set for an e2e run, and keep it running until
  the process is stopped. A replica set, since change streams (the MongoDBChangeStream
  websocket source) need one. mongod comes from the shared MongoDB binaries
  (~/.cache/mongodb-binaries), so nothing is installed; the data lives in a temporary
  directory that is removed on stop.

  Usage (a Playwright webServer entry, which waits for the port):
    node scripts/e2e-mongodb.mjs --port 27197
*/

import { parseArgs } from 'node:util';

import { MongoMemoryReplSet } from 'mongodb-memory-server';

const { values } = parseArgs({ options: { port: { type: 'string' } } });
const port = Number(values.port);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`e2e-mongodb requires --port. Received ${JSON.stringify(values.port)}.`);
}

const replSet = await MongoMemoryReplSet.create({
  // A loaded machine can take well over the 10 second default to start mongod.
  instanceOpts: [{ port, storageEngine: 'wiredTiger', launchTimeout: 60000 }],
  replSet: { count: 1 },
});
// eslint-disable-next-line no-console
console.log(`MongoDB replica set ready at ${replSet.getUri()}`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await replSet.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
