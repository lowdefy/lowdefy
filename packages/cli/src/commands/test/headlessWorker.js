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

import { parentPort, workerData } from 'node:worker_threads';

import openBuildApp from './openBuildApp.js';
import runHeadlessRepeated from './runHeadlessRepeated.js';

// A worker thread of a --build run (createHeadlessWorkers): it opens the production build once, as
// the run's own thread did (openBuildApp, with the run's test `secrets`), at its first journey, and
// runs each journey the run posts it on that app, one at a time (runHeadlessRepeated), each on a
// fresh session of its data set on the run's one data store. It answers each { id, item, repeat }
// with { id, result }, or { id, error: { message, stack } } when the run threw ({ id, error:
// { message, refused: true } } for every journey once the build would not open), and { type: 'close' }
// with { type: 'closed' } once its app is closed. Its globals and module state are its own, so
// journeys in other threads never share them.
const { directories, secrets } = workerData;
const context = { directories };
let opening;

function openApp() {
  opening = opening ?? openBuildApp({ context, secrets });
  return opening;
}

// A result is sent as a structured clone; one holding a value that cannot be cloned (a function a
// step's actual value carried) is sent as its JSON, which is all the run's report reads.
function postResult({ id, result }) {
  try {
    parentPort.postMessage({ id, result });
  } catch (error) {
    parentPort.postMessage({ id, result: JSON.parse(JSON.stringify(result)) });
  }
}

async function runJob({ id, item, repeat }) {
  try {
    const opened = await openApp();
    if (opened.refused !== undefined) {
      parentPort.postMessage({ id, error: { message: opened.refused, refused: true } });
      return;
    }
    postResult({
      id,
      result: await runHeadlessRepeated({ app: opened.app, context, item, repeat }),
    });
  } catch (error) {
    parentPort.postMessage({
      id,
      error: { message: error?.message ?? String(error), stack: error?.stack },
    });
  }
}

async function close() {
  try {
    const opened = await opening;
    await opened?.app?.close();
  } catch {
    // The run is ending: a session that would not close leaves nothing for the next one.
  } finally {
    parentPort.postMessage({ type: 'closed' });
  }
}

parentPort.on('message', (message) => {
  if (message?.type === 'close') {
    close();
    return;
  }
  runJob(message);
});
