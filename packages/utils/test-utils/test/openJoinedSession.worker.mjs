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

// A worker thread for joinDataStore.mongodb.test.js: it joins the store its parent started, as a
// dev server journey thread does, and opens sessions on it when asked.
import { parentPort, threadId } from 'node:worker_threads';

import joinDataStore from '../src/dataSets/joinDataStore.js';
import openDataSession from '../src/dataSets/openDataSession.js';

const logger = { info: () => {}, warn: () => {} };
const sessions = [];

parentPort.on('message', async ({ uri, dataSet }) => {
  try {
    const store = await joinDataStore({ uri });
    const opened = await openDataSession({ dataSet, logger, store });
    sessions.push(opened);
    parentPort.postMessage({
      threadId,
      databaseName: opened.session.databaseName,
      prefix: opened.session.prefix,
    });
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});
