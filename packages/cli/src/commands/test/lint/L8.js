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
import { classifyJourney, getStepKey } from '@lowdefy/node-utils';

import describeStep from './describeStep.js';

// Target keys that read the page where the target's blockId alone would do.
const PAGE_KEYS = ['text', 'containing', 'nth'];
// Grid targets name a row or a cell inside the block: the blockId alone names another control.
const GRID_KEYS = ['row', 'column'];
const TARGET_STEPS = ['click', 'fill', 'select'];
const TARGET_EXPECTATIONS = ['visible', 'hidden'];

function readTarget(step) {
  const key = getStepKey(step);
  if (TARGET_STEPS.includes(key)) {
    return step[key];
  }
  if (key === 'expect' && TARGET_EXPECTATIONS.includes(getStepKey(step.expect))) {
    return step.expect[getStepKey(step.expect)];
  }
  return undefined;
}

// Whether a target names its block and narrows it by what the page shows, so { blockId } alone
// would name the same control without reading the page.
function isReplaceable(target) {
  return (
    type.isObject(target) &&
    type.isString(target.blockId) &&
    PAGE_KEYS.some((key) => Object.hasOwn(target, key)) &&
    !GRID_KEYS.some((key) => Object.hasOwn(target, key))
  );
}

function replaceTarget(step) {
  const key = getStepKey(step);
  const keep = ([targetKey]) => !PAGE_KEYS.includes(targetKey);
  if (key === 'expect') {
    const expectation = getStepKey(step.expect);
    return {
      expect: {
        [expectation]: Object.fromEntries(Object.entries(step.expect[expectation]).filter(keep)),
      },
    };
  }
  return { [key]: Object.fromEntries(Object.entries(step[key]).filter(keep)) };
}

// L8: a journey that runs only in the browser, and only because some of its targets read the page
// (text, containing or nth) on a block they already name by blockId, could run headless, the fast
// level, if those targets named the block alone. Each such step is reported with the blockId to
// use. A check of what the person sees (expect: { text }) is never reported: a journey adds one
// only when what the page shows is the point, and then it is meant to run in the browser.
function L8({ journey }) {
  if (classifyJourney({ journey }).headless) {
    return [];
  }
  const replaced = journey.steps.map((step) =>
    isReplaceable(readTarget(step)) ? replaceTarget(step) : step
  );
  if (!classifyJourney({ journey: { ...journey, steps: replaced } }).headless) {
    return [];
  }
  return journey.steps.flatMap((step, index) => {
    const target = readTarget(step);
    if (!isReplaceable(target)) {
      return [];
    }
    const keys = PAGE_KEYS.filter((key) => Object.hasOwn(target, key)).join(' and ');
    return [
      {
        severity: 'warning',
        stepIndex: index,
        message: `${describeStep({ step, index })} names block "${
          target.blockId
        }" and reads the page for its ${keys}: target { blockId: ${
          target.blockId
        } } alone and the journey runs headless.`,
      },
    ];
  });
}

export default L8;
