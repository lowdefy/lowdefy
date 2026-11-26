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

import { parentPort } from 'node:worker_threads';

import createMainThreadCalls from './createMainThreadCalls.js';
import createWorkerDataStore from './createWorkerDataStore.js';
import createWorkerPageBuilds from './createWorkerPageBuilds.js';
import runHeadlessJob from './runHeadlessJob.js';

// A thread of the dev server's journey pool (createJourneyPool). It imports the server code in plain
// Node, once, and runs each journey the pool posts it ({ type: 'job', id, params, mutant }) one at
// a time (runHeadlessJob): the client engine and every call run here, on API contexts of this
// thread, with the journey's mutant run in this thread's registry. The main thread builds its
// pages and keeps the data store (createWorkerPageBuilds, createWorkerDataStore), which it answers
// over calls. It answers each job with { type: 'result', id, value } or { type: 'result', id,
// error: { message, stack } }. Its globals and module state are its own, so journeys in other
// threads never share them.
const calls = createMainThreadCalls({ port: parentPort });
const pageBuilds = createWorkerPageBuilds({ calls });
const { getStore } = createWorkerDataStore({ calls });

// A result is sent as a structured clone; one holding a value that cannot be cloned (a function a
// step's actual value carried) is sent as its JSON, which is all the route answers.
function postResult({ id, value }) {
  try {
    parentPort.postMessage({ type: 'result', id, value });
  } catch {
    parentPort.postMessage({ type: 'result', id, value: JSON.parse(JSON.stringify(value)) });
  }
}

async function runJob({ id, params, mutant }) {
  try {
    postResult({ id, value: await runHeadlessJob({ params, mutant, pageBuilds, getStore }) });
  } catch (error) {
    parentPort.postMessage({
      type: 'result',
      id,
      error: { message: error?.message ?? String(error), stack: error?.stack },
    });
  }
}

parentPort.on('message', (message) => {
  if (message?.type === 'answer') {
    calls.receive(message);
    return;
  }
  if (message?.type === 'job') {
    runJob(message);
  }
});
