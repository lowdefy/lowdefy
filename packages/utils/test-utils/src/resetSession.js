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
import releasePauseGates from './releasePauseGates.js';
import reloadDataSession from './dataSets/reloadDataSession.js';
import settleSession from './settleSession.js';

// Puts the session back to its data set between tests: every collection is emptied and the
// data set loaded again, which is several times cheaper than a new session. What the last test
// left running is ended first, so none of it writes into the next test's data: routines held
// at a pause gate are released, and background work is waited for. `sunk` is emptied. Stubs
// stay: they are set once for a file's tests.
async function resetSession({ testSession }) {
  checkSessionOpen({ testSession });
  releasePauseGates({ testSession });
  await settleSession({ testSession });
  await reloadDataSession({
    client: testSession.store.client,
    dataSet: testSession.dataSet,
    session: testSession.dataSession.session,
  });
  testSession.dataSession.sunk.length = 0;
}

export default resetSession;
