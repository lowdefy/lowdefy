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

async function ldfTime(name, fn) {
  const s = performance.now();
  try {
    return await fn();
  } finally {
    const r = globalThis.__ldfProf;
    if (r) {
      r.t[name] = (r.t[name] ?? 0) + performance.now() - s;
      r.c[name] = (r.c[name] ?? 0) + 1;
    }
  }
}
import { type } from '@lowdefy/helpers';
import { toWebhookBody } from '@lowdefy/node-utils';

import callSystemEndpoint from './callSystemEndpoint.js';
import callWebhook from './callWebhook.js';
import createSessionCaller from './createSessionCaller.js';
import failRequest from './failRequest.js';
import getSessionCollection from './getSessionCollection.js';
import getSessionStore from './getSessionStore.js';
import loadSessionRuntime from './loadSessionRuntime.js';
import pauseBefore from './pauseBefore.js';
import resetSession from './resetSession.js';
import seedSession from './seedSession.js';
import settleSession from './settleSession.js';
import storeLogger from './storeLogger.js';
import stubRequest from './stubRequest.js';
import testSessions from './testSessions.js';
import unfiredFailGates from './unfiredFailGates.js';
import { openDataSession, readDataSet } from './dataSets/index.js';
import readConnectionArtifacts from './dataSets/readConnectionArtifacts.js';
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
  const [runtime, dataSet, connectionArtifacts] = await Promise.all([
    ldfTime('session.runtime', () => loadSessionRuntime({ testApp })),
    ldfTime('session.readDataSet', () => named
      ? readDataSet({ configDirectory: config, buildDirectory: build, name: data })
      : readEmptyDataSet({ buildDirectory: build, name: NO_DATA_SET })),
    ldfTime('session.readConnectionArtifacts', () => readConnectionArtifacts({ buildDirectory: build })),
  ]);
  const store = await ldfTime('session.store', () => getSessionStore({ testApp }));
  const dataSession = await ldfTime('session.openDataSession', () => openDataSession({ dataSet, logger: storeLogger, store }));
  const testSession = {
    closed: false,
    // The built connections by id, for collection() and seed().
    connectionArtifacts,
    dataSession,
    dataSet,
    named,
    runtime,
    store,
    testApp,
  };
  testApp.sessions.add(testSession);

  const session = {
    as: (user) => createSessionCaller({ testSession, user }),
    collection: (connectionId) => getSessionCollection({ connectionId, testSession }),
    fail: (gate) => failRequest({ gate, testSession }),
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
    // The fail gates fail() set that no request has reached yet; reset() throws on any left.
    unfiredFailGates: () => unfiredFailGates({ testSession }),
    // Posts to a webhook endpoint as its sender does: body is sent as raw text, a string as
    // written and anything else as JSON, so a signature header computed over it verifies. Answers
    // { status, body, contentType, faults }; the request id the journey hosts read is left out.
    webhook: async (endpointId, { body, headers, query } = {}) => {
      const { rid, ...answer } = await callWebhook({
        endpointId,
        headers,
        query,
        rawBody: toWebhookBody(body),
        testSession,
      });
      return answer;
    },
  };
  testSessions.set(session, testSession);
  return session;
}

export default openSession;
