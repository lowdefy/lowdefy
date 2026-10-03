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

import buildFailureProperties from './buildFailureProperties.js';
import postHogState from './postHogState.js';

// Failures are rare; a broken page that fails on every keystroke must not flood PostHog.
const FAILURES_PER_APP_LOAD = 50;

// Captures one lowdefy_event_failed per failed block or app event, timestamped when the event's
// actions started, so it pairs with the click that caused it by the same rule as in dev. The
// subscription is kept per trace registry, which lives for the whole app load: PostHogInit can
// run from every page's events and still leaves one listener and one count.
function subscribeEventFailures({ trace }) {
  const current = postHogState.subscription;
  if (current !== null && current.trace === trace) {
    return;
  }
  if (current !== null) {
    current.unsubscribe();
  }
  const subscription = { count: 0, trace, unsubscribe: null };
  subscription.unsubscribe = trace.subscribe((payload) => {
    if (payload.success || subscription.count >= FAILURES_PER_APP_LOAD) {
      return;
    }
    subscription.count += 1;
    postHogState.client.capture('lowdefy_event_failed', buildFailureProperties(payload), {
      timestamp: payload.record.startTimestamp,
    });
  });
  postHogState.subscription = subscription;
}

export default subscribeEventFailures;
