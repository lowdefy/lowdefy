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

import { readDevInstance } from '@lowdefy/node-utils';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The app's dev server record, once it settles: a record in the starting
// state (a dev server still installing or building, as one the hub just
// started is) is polled every pollIntervalMs, up to timeoutMs, until it is
// ready, in error or gone. Returns the ready record, or null when there is no
// ready server to run against.
async function waitForDevInstance({
  configDirectory,
  pollIntervalMs = 250,
  timeoutMs = 10 * 60 * 1000,
  read = readDevInstance,
}) {
  const deadline = Date.now() + timeoutMs;
  let record = read({ configDirectory });
  while (record !== null && record.state === 'starting' && Date.now() < deadline) {
    await sleep(pollIntervalMs);
    record = read({ configDirectory });
  }
  return record !== null && record.state === 'ready' ? record : null;
}

export default waitForDevInstance;
