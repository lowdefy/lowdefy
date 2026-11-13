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

import findDbMismatch from './findDbMismatch.js';
import HeadlessStepError from './HeadlessStepError.js';

const POLL_MS = 100;

// expect.db reads the data's database through the host (findDocuments), and waits up to `timeout`
// ms for it to hold what the step expects, since a write the app makes in the background
// (context.waitUntil) may land after the step that caused it.
async function expectDb({ host, params, timeout }) {
  async function read() {
    try {
      return await host.findDocuments({
        collection: params.collection,
        connectionId: params.connectionId,
        match: params.match,
      });
    } catch (error) {
      throw new HeadlessStepError(error.message, {
        actual: error.message,
        expected: `documents in "${params.collection}" matching ${JSON.stringify(params.match)}`,
      });
    }
  }
  const deadline = Date.now() + timeout;
  let mismatch = findDbMismatch({ documents: await read(), params });
  while (!type.isUndefined(mismatch) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    mismatch = findDbMismatch({ documents: await read(), params });
  }
  if (!type.isUndefined(mismatch)) {
    throw new HeadlessStepError(mismatch.message, {
      actual: mismatch.actual,
      expected: mismatch.expected,
    });
  }
}

export default expectDb;
