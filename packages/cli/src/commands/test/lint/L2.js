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

import { isMountEventName, type } from '@lowdefy/helpers';
import { getStepKey, normaliseBlockId } from '@lowdefy/node-utils';

import describeStep from './describeStep.js';
import isAssertionStep from './isAssertionStep.js';

const ACTION_STEPS = ['click', 'open', 'press', 'back', 'goto'];
const INPUT_STEPS = ['fill', 'select'];

function targetBlockId(step) {
  const target = step[getStepKey(step)];
  if (type.isString(target)) {
    return target;
  }
  return type.isObject(target) && type.isString(target.blockId) ? target.blockId : null;
}

// Whether the action step must be followed by an assertion. goto and back
// always must. A click or open whose target ran no Lowdefy event (a Tabs
// header, a Collapse panel) only changes what is on screen, and the next
// step's target fails if it did not, so it is exempt. With no blockId or no
// measured path, it is checked strictly.
function mustAssert({ step, exercisedEntry }) {
  const key = getStepKey(step);
  if (key === 'goto' || key === 'back') {
    return true;
  }
  const blockId = targetBlockId(step);
  if (type.isNone(exercisedEntry) || blockId === null) {
    return true;
  }
  const normalised = normaliseBlockId(blockId);
  return exercisedEntry.exercised.events.some(
    (event) => event.blockId === normalised && !isMountEventName({ eventName: event.eventName })
  );
}

// The step after `index` that settles the question: an assertion, the next
// action or input step, or none when the journey ends first. as, email,
// screenshot and other waits are neutral.
function findNext({ steps, index }) {
  for (let next = index + 1; next < steps.length; next += 1) {
    const step = steps[next];
    if (isAssertionStep(step)) {
      return { asserted: true };
    }
    const key = getStepKey(step);
    if (ACTION_STEPS.includes(key) || INPUT_STEPS.includes(key)) {
      return { asserted: false, next };
    }
  }
  return { asserted: false, next: null };
}

// L2: an action that ran a Lowdefy event is followed by an assertion before
// the next action or input, so the journey checks what the event did. Input
// steps are exempt: the action that submits them carries the assertion.
function L2({ journey, exercisedEntry }) {
  const problems = [];
  journey.steps.forEach((step, index) => {
    if (!ACTION_STEPS.includes(getStepKey(step)) || !mustAssert({ step, exercisedEntry })) {
      return;
    }
    const { asserted, next } = findNext({ steps: journey.steps, index });
    if (asserted) {
      return;
    }
    const before = next === null ? 'the journey ends' : `step ${next}`;
    const unmeasured = type.isNone(exercisedEntry)
      ? ' Run the journey once (lowdefy test) so lint can tell whether it ran an event.'
      : '';
    problems.push({
      severity: 'error',
      stepIndex: index,
      message: `${describeStep({
        step,
        index,
      })} is not followed by an expect or wait: { request } before ${before}.${unmeasured}`,
    });
  });
  return problems;
}

export default L2;
