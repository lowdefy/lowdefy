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

import matchesRequestKey from './matchesRequestKey.js';

// Holds a routine at the first open pause gate its request matches, in the order the gates were
// set: the gate records that it was reached and by which request, tells the test, and the
// routine waits for release.
// The gate is taken before the first await, so two routines racing to it never take one gate.
async function holdAtPauseGate({ args, session }) {
  const gate = session.pauseGates.find(
    (entry) => !entry.reached && !entry.released && matchesRequestKey({ entry, request: args })
  );
  if (type.isUndefined(gate)) return;
  gate.reached = true;
  // The request that reached it, so a release can name the gate by it (createJourneyRaces).
  gate.reachedBy = { requestId: args.requestId, endpointId: args.endpointId, pageId: args.pageId };
  gate.arrive();
  await gate.whenReleased;
}

export default holdAtPauseGate;
