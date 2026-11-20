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

import checkSessionOpen from './checkSessionOpen.js';
import drainSessionWork from './dataSets/drainSessionWork.js';

const SETTLE_TIMEOUT_MS = 30000;

// Waits for the background work the session's calls started: an `async: true` endpoint's
// routine, and anything else handed to context.waitUntil, work that work started included. A
// server answers before this work ends, so a test waits here before it reads what it wrote.
async function settleSession({ testSession }) {
  checkSessionOpen({ testSession });
  const settled = await drainSessionWork({
    work: testSession.dataSession.session.work,
    timeoutMs: SETTLE_TIMEOUT_MS,
  });
  if (!settled) {
    throw new Error(
      `Background work was still running after ${
        SETTLE_TIMEOUT_MS / 1000
      } s. A routine held by pauseBefore must be released before it can settle.`
    );
  }
}

export default settleSession;
