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

import { acquireMachineSlot } from '@lowdefy/node-utils';

const BROWSER_SLOTS = 3;
const BROWSER_SLOT_WAIT_MS = 5 * 60 * 1000;

/*
Runs one browser operation (a journey, a screenshot, a state inspection, an
operator evaluation, a state load) in one of the machine's browser slots, so
at most three run at once across every dev server on the machine, however
the call came in. A slot covers the whole operation, every page and actor of
a journey included: a bound per page would deadlock a journey with more
actors than slots. The operation's own timeouts start once the slot is
taken. A wait that outlasts BROWSER_SLOT_WAIT_MS is answered as the
operation's error, like every other failure of these tools.
*/
async function withBrowserSlot({ task, acquire = acquireMachineSlot }) {
  let slot;
  try {
    slot = await acquire({ name: 'browser', limit: BROWSER_SLOTS, waitMs: BROWSER_SLOT_WAIT_MS });
  } catch (error) {
    return { error: error.message };
  }
  try {
    return await task();
  } finally {
    slot.release();
  }
}

export default withBrowserSlot;
