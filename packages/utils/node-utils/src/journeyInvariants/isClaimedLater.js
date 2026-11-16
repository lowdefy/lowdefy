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

import {
  CALL_STEP_KEYS,
  getStepKey,
  INTERACTION_STEP_KEYS,
} from '../journeyGrammar/validateJourneySteps.js';
import isExpectErrorStep from './isExpectErrorStep.js';

// Whether the step at `index` has app errors an expect.error after it claims: an interaction
// directly followed by one, or a call or request followed by one among the expect steps that
// read its answer. The browser and headless runners both decide it here, so they agree.
function isClaimedLater({ index, steps }) {
  const key = getStepKey(steps[index]);
  if (INTERACTION_STEP_KEYS.includes(key)) {
    return isExpectErrorStep(steps[index + 1]);
  }
  if (!CALL_STEP_KEYS.includes(key)) {
    return false;
  }
  for (let next = index + 1; next < steps.length; next += 1) {
    if (getStepKey(steps[next]) !== 'expect') return false;
    if (isExpectErrorStep(steps[next])) return true;
  }
  return false;
}

export default isClaimedLater;
