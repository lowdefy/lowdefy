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

// The actor a journey starts as; `as` steps switch to others by name.
const MAIN_ACTOR = 'main';

// L7: an `as` that switches to the person already acting does nothing, so the
// journey reads as if it checked what a second person sees when it checks the
// first person's own view. `as: main` is the journey's own user. On a data set
// journey, the name of a data set user opens that user in a browser of their
// own on the run's database (the way to check what a second person sees), so a
// switch to the actor already active is almost always a mistake.
function L7({ journey }) {
  let current = MAIN_ACTOR;
  const problems = [];
  journey.steps.forEach((step, index) => {
    if (getStepKey(step) !== 'as') {
      return;
    }
    if (step.as === current) {
      problems.push({
        severity: 'warning',
        stepIndex: index,
        message: `${describeStep({
          step,
          index,
        })} switches to ${
          current === MAIN_ACTOR ? "the journey's own user (main)" : `"${current}"`
        }, who is already acting: name the other person, or drop the step.`,
      });
    }
    current = step.as;
  });
  return problems;
}

export default L7;
