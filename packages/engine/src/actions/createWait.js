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

import { type, wait } from '@lowdefy/helpers';

// The timer behind the Wait action. An event is loading for its whole run, so while the step it
// is on only sleeps, the event says so and until when: a reader of event.loading (the dev
// server's page readiness check) can then tell an event that is working from one that will do
// nothing before a known time.
//
// An 'async: true' action is not the step its event is on - the chain carries on beside it - so
// it is given no eventDescription and marks nothing.
function createWait({ eventDescription }) {
  return async function waitAction({ ms }) {
    if (type.isNone(eventDescription)) {
      await wait(ms);
      return;
    }
    eventDescription.waitingUntil = Date.now() + ms;
    await wait(ms);
    // Cleared even when a later run of the same event has set it since: this run is about to
    // work again, so the event is no longer only waiting.
    eventDescription.waitingUntil = null;
  };
}

export default createWait;
