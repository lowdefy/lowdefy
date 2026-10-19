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

import getDataStore from './dataSets/getDataStore.js';
import openDataSession from './dataSets/openDataSession.js';

// Runs `task` on a data set's own database when the call named one: a fresh
// database on the dev server's memory store, loaded with the data set and
// dropped once the task settles, exactly as a journey's. The task gets
// `dataCookie` (for a headless browser context, see openPage) and
// `dataSession` (for a context the dev server builds itself, see
// createLowdefyContext); both are undefined without a data set. A data set
// that fails to load comes back as { error } without running the task.
async function withDataSession({ dataSet, task }) {
  if (type.isUndefined(dataSet)) {
    return task({});
  }
  try {
    await getDataStore();
  } catch (error) {
    return {
      error: `Could not start the data store for data set "${dataSet.name}": ${error.message}`,
    };
  }
  let session;
  try {
    session = await openDataSession({ dataSet });
  } catch (error) {
    return { error: error.message };
  }
  try {
    return await task({ dataCookie: session.cookie, dataSession: session.session });
  } finally {
    await session.close();
  }
}

export default withDataSession;
