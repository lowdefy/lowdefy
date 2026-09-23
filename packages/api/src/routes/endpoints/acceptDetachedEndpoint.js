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

import runDetachedEndpoint from './runDetachedEndpoint.js';
import scheduleBackground from './scheduleBackground.js';

// Accept a detached call and run it AFTER the response. The /api/detached route
// answers 202 at once and the endpoint runs under this invocation's own
// waitUntil (bounded by its maxDuration, exactly the budget it had before).
//
// Before this, the route awaited the whole routine and only then replied - and
// the dispatcher's scheduleBackground keeps its OWN invocation alive until that
// reply arrives. So every parent stayed billed for as long as its detached
// children ran (a cron tick that answers in milliseconds held its invocation
// for its slowest crawl), and a chain of detached hops was a chain of nested
// in-flight requests - which is what trips the platform's loop detection
// (508 INFINITE_LOOP_DETECTED) three or four hops down. "Detached" now means
// the dispatcher's fetch settles as soon as the target has accepted the call.
//
// The outcome exists only in the logs (`detached_run_done` with the routine's
// status, or `detached_run_failed`), as it already did for the dispatcher.
function acceptDetachedEndpoint(context, { endpointId, payload, principal }) {
  scheduleBackground(context, { event: 'detached_run', endpointId }, () =>
    runDetachedEndpoint(context, { endpointId, payload, principal })
  );
  return { accepted: true };
}

export default acceptDetachedEndpoint;
