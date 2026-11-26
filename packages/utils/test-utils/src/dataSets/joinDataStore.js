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

// As getDataStore's client: a local mongod that does not answer within this long is gone.
const SERVER_SELECTION_TIMEOUT_MS = 5000;

// A client on a data store another thread of this process keeps: the dev server's journey worker
// threads open their sessions on the store its main thread started (getDataStore), at `uri`. It
// answers in the store's shape ({ client, uri, stop }), so openDataSession takes it as `store`.
// stop() closes only this client: the store is the main thread's to stop. `onGone` is called
// when a session finds the store gone (openDataSession stops the store it was given), so the
// main thread can stop it and start a fresh one.
async function joinDataStore({ uri, onGone }) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
  await client.connect();
  let stopping;
  return {
    client,
    uri,
    stop() {
      stopping =
        stopping ??
        (async () => {
          await client.close().catch(() => {});
          await onGone?.();
        })();
      return stopping;
    },
  };
}

export default joinDataStore;
