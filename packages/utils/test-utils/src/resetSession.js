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
import reloadDataSession from './dataSets/reloadDataSession.js';
import settleSession from './settleSession.js';
import { describeFailGate, listUnfiredFailGates, releasePauseGates } from './dataSets/index.js';

function describeUnfired(gates) {
  const listed = gates
    .map((gate) => `the forced failure on ${describeFailGate(gate)} ("${gate.message}")`)
    .join(', ');
  return `session.reset(): ${listed} never fired: no request the test made matched it, so nothing tested what it fails. The session was reset and the gate cleared.`;
}

// Puts the session back to its data set between tests: every collection is emptied and the
// data set loaded again, which is several times cheaper than a new session. What the last test
// left running is ended first, so none of it writes into the next test's data: routines held
// at a pause gate are released, and background work is waited for. `sunk`, the fail gates and the
// forced failures they recorded are emptied, so a gate one test set never fails the next test's
// requests. Stubs stay: they are set once for a file's tests. A fail gate that never fired fails
// the test that set it, as it fails a journey: the session is reset first, so the next test still
// starts clean, then the gates are named in the error thrown.
async function resetSession({ testSession }) {
  checkSessionOpen({ testSession });
  const { session } = testSession.dataSession;
  const unfired = listUnfiredFailGates({ session });
  releasePauseGates({ session });
  await settleSession({ testSession });
  await reloadDataSession({
    client: testSession.store.client,
    dataSet: testSession.dataSet,
    session,
  });
  session.sunk.length = 0;
  session.failGates.length = 0;
  session.forced.length = 0;
  if (unfired.length > 0) {
    throw new Error(describeUnfired(unfired));
  }
}

export default resetSession;
