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

import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';

// Node keeps every module it loads for the life of the process, and an ES
// module can not be dropped from that cache, so importing a changed file again
// in the manager returns the old module and the old modules it imports. A
// plugin's type list is read from its built files, which change while the dev
// server runs (a new block, request or operator type), so each read imports
// the file in a new worker thread, which starts with an empty module cache.
// Resolves to the module's default export (its namespace if it has none),
// copied to the manager as structured-clone data.
function importFresh(filePath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./importFreshWorker.mjs', import.meta.url), {
      workerData: { url: pathToFileURL(filePath).href },
    });
    worker.once('message', (value) => {
      resolve(value);
      worker.terminate();
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Importing "${filePath}" stopped with exit code ${code}.`));
      }
    });
  });
}

export default importFresh;
