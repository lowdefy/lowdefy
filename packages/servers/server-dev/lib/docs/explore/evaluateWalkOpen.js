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

import evaluateWalkWindow from './evaluateWalkWindow.js';
import takeJourneyEvents from '../observe/takeJourneyEvents.js';
import { takeErrors } from './walkSessions.js';
import waitForClientErrorReports from '../observe/waitForClientErrorReports.js';

// What opening the walk's page caused (its onInit and onMount requests
// included), judged as the journey runner judges a journey's open
// (createJourneyAppErrors' judgeOpen): one window from the walk's
// registration to now, no step and no trace emits. The findings then carry
// the key a journey on the page fails with at phase 'open', so a finding at
// open can be proven. Returns findings { kind, severity, message, pageId,
// source, configKey, key }, with no step.
async function evaluateWalkOpen({ walk }) {
  await waitForClientErrorReports({ events: walk.events });
  const page = walk.runner.actors.current().page;
  const since = walk.openedAt;
  const until = Date.now();
  const url = page.isClosed() ? null : page.url();
  const window = {
    since,
    until,
    urlBefore: url,
    urlAfter: url,
    emits: [],
    mutationCount: null,
    ...takeJourneyEvents({ events: walk.events, since, until }),
    errors: takeErrors({ walkId: walk.walkId, since, until }),
  };
  return evaluateWalkWindow({
    walk,
    step: {},
    result: { status: 'ok' },
    window,
    pageId: walk.observation.pageId,
  });
}

export default evaluateWalkOpen;
