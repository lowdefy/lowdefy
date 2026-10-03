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

import { Worker } from 'node:worker_threads';

// Imports the connection packages in a worker thread and resolves with their
// schemas as plain JSON, per package (null when the package does not
// resolve). The thread is terminated once it answers, so the database drivers
// those packages load never stay in the build's process.
function runConnectionSchemaWorker({ packageNames, serverDirectory }) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./collectConnectionSchemasWorker.js', import.meta.url), {
      workerData: { packageNames, serverDirectory },
    });
    let answered = false;
    worker.once('message', (collected) => {
      answered = true;
      resolve(collected);
      worker.terminate();
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (!answered) {
        reject(new Error(`Connection schema worker exited with code ${code} before answering.`));
      }
    });
  });
}

export default runConnectionSchemaWorker;
