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

import describeStep from './describeStep.js';

function isPlaceholder(step) {
  const key = getStepKey(step);
  if (key === 'fill' || key === 'select') {
    return step[key].from === 'shape' || step[key].value === null;
  }
  return (
    key === 'expect' && getStepKey(step.expect) === 'state' && step.expect.state.from === 'shape'
  );
}

// L1: no placeholders. A compiled or generated candidate marks a value its
// trace could not hold as `from: shape`; the runner refuses it until someone
// fills it in.
function L1({ journey }) {
  return journey.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => isPlaceholder(step))
    .map(({ step, index }) => ({
      severity: 'error',
      stepIndex: index,
      message: `${describeStep({
        step,
        index,
      })} is a placeholder (from: shape or value: null): write the value it needs.`,
    }));
}

export default L1;
