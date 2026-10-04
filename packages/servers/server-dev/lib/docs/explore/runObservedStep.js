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

import installStepObserver from './installStepObserver.js';
import readStepObserver from './readStepObserver.js';
import runJourneySteps from '../runJourneySteps.js';
import takeWalkEvents from './takeWalkEvents.js';
import { takeErrors } from './walkSessions.js';
import waitForClientErrorReports from './waitForClientErrorReports.js';

// antd's click wave: inserted into a clicked Button and removed when its
// motion ends.
const TRANSIENT_SELECTOR = '.ant-wave';

// Runs one walk step through the journey runner's own loop (settle included)
// inside an observed window, and returns the runner's result with what the
// window produced for this walk: trace emits, lasting DOM mutations (null
// when a full page load replaced the document), the URL before and after,
// and the page errors, app requests and responses and claimed error entries
// timestamped inside it.
async function runObservedStep({ walk, step }) {
  const page = walk.runner.actors.current().page;
  await page.evaluate(installStepObserver);
  const urlBefore = page.url();
  const since = Date.now();
  const { results, failure } = await runJourneySteps({ journey: walk.runner, steps: [step] });
  await waitForClientErrorReports({ events: walk.events });
  const observed = page.isClosed()
    ? null
    : await page
        .evaluate(readStepObserver, { transientSelector: TRANSIENT_SELECTOR })
        .catch(() => null);
  const until = Date.now();
  const window = {
    since,
    until,
    urlBefore,
    urlAfter: page.isClosed() ? null : page.url(),
    emits: observed?.emits ?? [],
    mutationCount: observed?.mutationCount ?? null,
    ...takeWalkEvents({ events: walk.events, since, until }),
    errors: takeErrors({ walkId: walk.walkId, since, until }),
  };
  return { result: results[0], failure, window };
}

export default runObservedStep;
