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

import compileEvent from './compileEvent.js';
import sessionEvents from './sessionEvents.js';

// One session compiled to one journey. The steps are the interactions in the
// order the user made them; the events no interaction reaches become comments
// against the step that follows them, so the file says what the session did
// that the journey does not.
//
// A failing event ends the journey at its own step and nothing after it is
// compiled: the state a failed chain left behind is not a fact worth locking,
// and the step's expectation is simply that it succeeds - which makes the
// candidate a failing test until the bug is fixed.
function compileSession({ blockMetas, blockTypes, name, session }) {
  const events = sessionEvents({ session });
  const steps = [];
  const comments = new Map();
  const pending = [];
  let failure;

  const attach = () => {
    if (pending.length === 0) return;
    comments.set(steps.length, pending.join('\n'));
    pending.length = 0;
  };

  for (const event of events) {
    if (event.success === false) {
      const { skipped, steps: eventSteps } = compileEvent({ blockMetas, blockTypes, event });
      if (!type.isUndefined(skipped)) pending.push(skipped);
      // Only the interaction, not what it wrote: the first step compiled for a
      // failing event is the one that has to start passing.
      if (eventSteps.length > 0) {
        attach();
        steps.push(eventSteps[0]);
      }
      failure = {
        block_id: event.block_id,
        error: event.error?.name ?? 'Error',
        event_name: event.event_name,
        page_id: event.page_id,
        rid: event.rid,
        ...(type.isNone(event.error?.config_key) ? {} : { config_key: event.error.config_key }),
      };
      break;
    }
    const { skipped, steps: eventSteps } = compileEvent({ blockMetas, blockTypes, event });
    if (!type.isUndefined(skipped)) pending.push(skipped);
    eventSteps.forEach((step) => {
      attach();
      steps.push(step);
    });
  }

  const footer = pending.length === 0 ? undefined : pending.join('\n');
  return {
    comments,
    failure,
    footer,
    journey: { name, pageId: session.page_id, steps },
  };
}

export default compileSession;
