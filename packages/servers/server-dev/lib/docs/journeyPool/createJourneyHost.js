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

import { type } from '@lowdefy/helpers';
import { getDataStore, isDataStoreGone } from '@lowdefy/test-utils/dataSets';

import createLogger from '../../server/log/createLogger.js';

const logger = createLogger();

// The dev server's data store, answering: one whose mongod has gone (it was killed, or the machine
// slept) is stopped and a fresh one started, so a thread never joins a dead store. On the main
// thread a journey's session open finds it gone the same way (openDataSession).
async function readLiveDataStore() {
  const store = await getDataStore({ logger });
  try {
    await store.client.db('admin').command({ ping: 1 });
    return store;
  } catch (error) {
    if (!isDataStoreGone(error)) throw error;
    await store.stop();
    return getDataStore({ logger });
  }
}

// A page build's outcome as the journey thread reads it (createDevServerHost reads `built`): the
// build's own result can carry values a thread cannot be sent.
function toThreadResult(result) {
  if (type.isBoolean(result)) return result;
  return { built: result?.built === true, installing: result?.installing === true };
}

// What the main thread answers one journey's thread (createJourneyPool's host): its page builds,
// on `pageBuilds` (createLocalPageBuilds), each build's context kept for the journey's length under
// a handle the thread passes back for the page's _js; and the data store, which the main thread
// keeps (getDataStore), answered only while it responds, and stops when a thread finds it gone. A thread that joins the store is
// added to `storeThreads`, so its databases are dropped once it stops (getJourneyPool).
function createJourneyHost({ pageBuilds, storeThreads }) {
  const builds = new Map();
  let nextHandle = 0;
  return {
    async buildPage({ pageId }) {
      const { result, built } = await pageBuilds.build({ pageId });
      if (type.isNone(built)) {
        return { result: toThreadResult(result), built: null };
      }
      nextHandle += 1;
      builds.set(nextHandle, built);
      return { result: toThreadResult(result), built: nextHandle };
    },
    async pageJsEntries({ pageConfig, built }) {
      return pageBuilds.jsEntries({ pageConfig, built: builds.get(built) ?? null });
    },
    async dataStoreUri(args, { threadId }) {
      storeThreads.add(threadId);
      const store = await readLiveDataStore();
      return store.uri;
    },
    async dataStoreGone({ uri }) {
      const store = await getDataStore({ logger });
      if (store.uri === uri) {
        await store.stop();
      }
    },
  };
}

export default createJourneyHost;
