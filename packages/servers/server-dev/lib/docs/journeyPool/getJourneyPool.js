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

import { readHeadlessThreadLimit } from '@lowdefy/node-utils';
import { dropThreadDatabases, getDataStore } from '@lowdefy/test-utils/dataSets';

import createJourneyPool from './createJourneyPool.js';
import createLogger from '../../server/log/createLogger.js';
import readPluginSignature from './readPluginSignature.js';

const logger = createLogger();

// One pool per dev server process. Kept on globalThis because Vite can evaluate the journey route
// more than once (an SSR reload), and every evaluation must post to the same threads.
const POOL_KEY = Symbol.for('lowdefy.devServer.journeyPool');

function createPoolState() {
  // The threads that asked for the data store: their sessions' databases are dropped once they
  // stop (createJourneyHost adds them).
  const storeThreads = new Set();
  async function onThreadStopped({ threadId }) {
    if (!storeThreads.delete(threadId)) return;
    try {
      const store = await getDataStore({ logger });
      await dropThreadDatabases({ client: store.client, threadId });
    } catch (error) {
      logger.debug(
        { event: 'debug_journey_thread_cleanup', err: error },
        `The databases of journey thread ${threadId} were not dropped: ${error.message}`
      );
    }
  }
  return {
    pool: createJourneyPool({
      size: readHeadlessThreadLimit(),
      readSignature: readPluginSignature,
      onThreadStopped,
    }),
    storeThreads,
  };
}

// The dev server's journey pool (createJourneyPool), started on first use, with the threads that
// joined its data store ({ pool, storeThreads }). It runs at most as many threads as the machine has
// cores (less one above 4 cores), and no more than one per GiB of memory (readHeadlessThreadLimit), the rule
// `lowdefy test` sizes its runs by: the pool serves every caller of the dev server, so two runs at
// once share its threads instead of starting twice as many.
function getJourneyPool() {
  globalThis[POOL_KEY] ??= createPoolState();
  return globalThis[POOL_KEY];
}

export default getJourneyPool;
