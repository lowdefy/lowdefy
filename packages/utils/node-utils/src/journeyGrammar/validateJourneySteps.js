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

import describeValue from './describeValue.js';
import validateStep from './validateStep.js';

// Checks a whole step list before a browser is opened, so an agent gets a
// grammar mistake back in milliseconds instead of after a page load. Returns
// { error } naming the offending step, or {} when every step is well-formed.
function validateJourneySteps({ steps }) {
  if (!type.isArray(steps)) {
    return {
      error: `Journey "steps" should be an array of steps. Received ${describeValue(steps)}.`,
    };
  }
  for (let index = 0; index < steps.length; index += 1) {
    const message = validateStep({ step: steps[index], index });
    if (!type.isUndefined(message)) {
      return { error: message };
    }
  }
  return {};
}

export default validateJourneySteps;
