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

import describeStep from './describeStep.js';
import isAssertionStep from './isAssertionStep.js';

// L6: the journey ends on an assertion, so its last action is checked. A
// final wait: { request } counts.
function L6({ journey }) {
  const index = journey.steps.length - 1;
  const step = journey.steps[index];
  if (isAssertionStep(step)) {
    return [];
  }
  return [
    {
      severity: 'error',
      stepIndex: index,
      message: `the last step, ${describeStep({
        step,
        index,
      })}, is not an expect or wait: { request }.`,
    },
  ];
}

export default L6;
