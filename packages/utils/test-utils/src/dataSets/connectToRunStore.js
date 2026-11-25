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

function ldfMonitor(client, prefix) {
  const started = new Map();
  client.on('commandSucceeded', (event) => {
    const r = globalThis.__ldfProf;
    if (!r) return;
    const name = `${prefix}:${event.commandName}`;
    r.t[name] = (r.t[name] ?? 0) + event.duration;
    r.c[name] = (r.c[name] ?? 0) + 1;
    r.t.dbTotal = (r.t.dbTotal ?? 0) + event.duration;
    r.c.dbTotal = (r.c.dbTotal ?? 0) + 1;
  });
  client.on('commandFailed', (event) => {
    const r = globalThis.__ldfProf;
    if (!r) return;
    r.t.dbTotal = (r.t.dbTotal ?? 0) + event.duration;
  });
  return started;
}
import { MongoClient } from 'mongodb';

import isDataStoreGone from './isDataStoreGone.js';
import removeRunStoreRecord from './removeRunStoreRecord.js';
import waitForRunStoreRecord from './waitForRunStoreRecord.js';

// The store is a local mongod: a client that cannot reach it within this long is looking at a
// dead store.
const SERVER_SELECTION_TIMEOUT_MS = 5000;
// A record can name a store that is gone while its keeper pid still lives: the pid was reused,
// or the keeper is stopping. Each such record is replaced; three in a row is a store that keeps
// dying, which is thrown.
const JOIN_ATTEMPTS = 3;

// Joins the run's data store: waits for its record (waitForRunStoreRecord) and connects to the
// URI in it. Returns this caller's client and the record it joined.
async function connectToRunStore({ ownerPid, recordPath, timeoutMs }) {
  for (let attempt = 1; ; attempt += 1) {
    const record = await waitForRunStoreRecord({ ownerPid, recordPath, timeoutMs });
    const client = new MongoClient(record.uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      monitorCommands: true,
    });
    ldfMonitor(client, 'db.store');
    try {
      await client.connect();
      return { client, record };
    } catch (error) {
      await client.close().catch(() => {});
      if (!isDataStoreGone(error) || attempt === JOIN_ATTEMPTS) throw error;
      removeRunStoreRecord({ recordPath, token: record.token });
    }
  }
}

export default connectToRunStore;
