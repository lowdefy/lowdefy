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

import normaliseJourneySteps from './normaliseJourneySteps.js';
import { getStepKey } from './validateJourneySteps.js';

const PAGE_LESS_STEP_KEYS = ['call', 'request', 'as'];
const PAGE_LESS_EXPECT_KEYS = ['error', 'status', 'calls', 'db'];

// Whether a step runs with no page open: a direct call, a switch of caller, a
// fixed wait, or a check of a call's answer, the calls made or the database. A
// request's calls are counted on the current page unless the check names its
// pageId, so one without a pageId needs a page.
function runsWithoutPage(step) {
  const key = getStepKey(step);
  if (PAGE_LESS_STEP_KEYS.includes(key)) {
    return true;
  }
  if (key === 'wait') {
    return getStepKey(step.wait) === 'ms';
  }
  if (key !== 'expect') {
    return false;
  }
  const expectKey = getStepKey(step.expect);
  if (expectKey === 'calls') {
    const calls = step.expect.calls;
    return type.isUndefined(calls.request) || !type.isUndefined(calls.pageId);
  }
  return PAGE_LESS_EXPECT_KEYS.includes(expectKey);
}

// The first step of a journey that needs a page open, as { index, step }, or
// undefined when every step runs without one: a journey of such steps may
// leave out its pageId. Runs on steps validateJourneySteps accepted.
function findStepNeedingPage({ steps }) {
  const normalised = normaliseJourneySteps({ steps });
  const index = normalised.findIndex((step) => !runsWithoutPage(step));
  if (index === -1) {
    return undefined;
  }
  return { index, step: steps[index] };
}

export default findStepNeedingPage;
