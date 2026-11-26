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

import { joinDataStore } from '@lowdefy/test-utils/dataSets';

// The data store a journey worker thread opens its sessions on: the main thread's (getDataStore),
// joined by its URI, which the thread asks for at each journey, so a store the main thread started
// again after it stopped responding is joined anew. A session that finds the store gone tells the
// main thread (dataStoreGone), which stops it, so the next journey's ask starts a fresh one.
function createWorkerDataStore({ calls }) {
  let joined = null;

  async function getStore() {
    const uri = await calls.call('dataStoreUri');
    if (joined?.uri !== uri) {
      const previous = joined;
      joined = {
        uri,
        store: joinDataStore({
          uri,
          onGone: () => calls.call('dataStoreGone', { uri }),
        }),
      };
      // Every session on the previous store has closed: a thread runs one journey at a time.
      previous?.store.then((store) => store.client.close()).catch(() => {});
    }
    try {
      return await joined.store;
    } catch (error) {
      joined = null;
      throw error;
    }
  }

  return { getStore };
}

export default createWorkerDataStore;
