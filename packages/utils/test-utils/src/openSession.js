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

import callSystemEndpoint from './callSystemEndpoint.js';
import createSessionCaller from './createSessionCaller.js';
import getSessionCollection from './getSessionCollection.js';
import getSessionStore from './getSessionStore.js';
import loadSessionRuntime from './loadSessionRuntime.js';
import pauseBefore from './pauseBefore.js';
import resetSession from './resetSession.js';
import seedSession from './seedSession.js';
import settleSession from './settleSession.js';
import storeLogger from './storeLogger.js';
import stubRequest from './stubRequest.js';
import { openDataSession, readDataSet } from './dataSets/index.js';
import readEmptyDataSet from './dataSets/readEmptyDataSet.js';

// What a connection refusal calls a session that was opened without a data set.
const NO_DATA_SET = '(no data set)';

// Opens a session: fresh databases on the test run's data store, one per database the app's
// connections name, loaded with the data set `data` names (tests/data/<data>.yaml, the files
// journeys read) or left empty. Calls made through the session run the app's built endpoints
// and requests in this process, on those databases. One session per test file, with reset()
// between tests, is the cheap way to use it. The app's close() ends its sessions.
async function openSession({ data, testApp }) {
  if (testApp.closed) {
    throw new Error('The test app is closed. Open one with openTestApp.');
  }
  if (!type.isNone(data) && !type.isString(data)) {
    throw new Error(
      `openSession "data" should be the name of a data set in tests/data. Received ${JSON.stringify(
        data
      )}.`
    );
  }
  const { build, config } = testApp.directories;
  const named = type.isString(data);
  const [runtime, dataSet] = await Promise.all([
    loadSessionRuntime({ testApp }),
    named
      ? readDataSet({ configDirectory: config, buildDirectory: build, name: data })
      : readEmptyDataSet({ buildDirectory: build, name: NO_DATA_SET }),
  ]);
  const store = await getSessionStore({ testApp });
  const dataSession = await openDataSession({ dataSet, logger: storeLogger, store });
  const testSession = {
    closed: false,
    dataSession,
    dataSet,
    // Pause gates no routine has reached yet, by step id (pauseBefore).
    gates: new Map(),
    // The release of each gate a routine is held at.
    held: new Set(),
    named,
    runtime,
    store,
    // Stubbed request types: connection type -> request type -> function (stubRequest).
    stubs: new Map(),
    testApp,
  };
  testApp.sessions.add(testSession);

  return {
    as: (user) => createSessionCaller({ testSession, user }),
    collection: (connectionId) => getSessionCollection({ connectionId, testSession }),
    pauseBefore: (stepId) => pauseBefore({ stepId, testSession }),
    reset: () => resetSession({ testSession }),
    seed: (connectionId, docs) => seedSession({ connectionId, docs, testSession }),
    settled: () => settleSession({ testSession }),
    stub: (connectionType, requestType, fn) =>
      stubRequest({ connectionType, fn, requestType, testSession }),
    // The session's own array: requests sunk or stubbed while its calls run show in it.
    sunk: dataSession.sunk,
    system: () => ({
      call: (endpointId, payload) => callSystemEndpoint({ endpointId, payload, testSession }),
    }),
  };
}

export default openSession;
