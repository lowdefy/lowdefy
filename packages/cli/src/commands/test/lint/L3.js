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

import { getStepKey } from '@lowdefy/node-utils';

// L3: no fixed waits. A wait of n ms is either too short on a slow machine
// or too long everywhere else.
function L3({ journey }) {
  return journey.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => getStepKey(step) === 'wait' && getStepKey(step.wait) === 'ms')
    .map(({ index }) => ({
      severity: 'error',
      stepIndex: index,
      message: `step ${index} (wait: { ms }) waits a fixed time: wait for a request or a state, or expect the outcome, instead.`,
    }));
}

export default L3;
