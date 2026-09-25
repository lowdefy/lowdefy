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

import { wait } from '@lowdefy/helpers';
import { readDevInstance } from '@lowdefy/node-utils';

// An edit reaches the manager's file watcher a moment after it is saved, and
// the watcher debounces before building, so an agent that asks for build
// status straight after an edit would read the build before it. The manager
// sets `building` in the instance record from the first change of a batch
// until the batch is processed; this waits for that to clear. The grace
// window covers an edit the watcher has not seen yet.
async function waitForBuild({ graceMs = 1000, timeoutMs = 60000, intervalMs = 100 } = {}) {
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;
  const isBuilding = () => readDevInstance({ configDirectory })?.building === true;
  const start = Date.now();
  let sawBuild = false;
  while (Date.now() - start < graceMs) {
    if (isBuilding()) {
      sawBuild = true;
      break;
    }
    await wait(intervalMs);
  }
  while (isBuilding()) {
    if (Date.now() - start > timeoutMs) {
      return { settled: false, waitedMs: Date.now() - start };
    }
    await wait(intervalMs);
  }
  return { settled: true, sawBuild, waitedMs: Date.now() - start };
}

export default waitForBuild;
