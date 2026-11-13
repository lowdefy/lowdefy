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

// Steps a headless run takes: they act on blocks by id, move between pages, switch caller, wait
// on the engine, or call the server directly.
const HEADLESS_STEP_KEYS = [
  'as',
  'back',
  'call',
  'click',
  'expect',
  'fill',
  'goto',
  'press',
  'request',
  'select',
  'wait',
];
// Checks a headless run reads from the engine, the calls it recorded or the data session.
const HEADLESS_EXPECT_KEYS = [
  'calls',
  'db',
  'error',
  'hidden',
  'state',
  'status',
  'url',
  'visible',
];
// Target keys that read the DOM: a control's text, a grid row or column, a pick among matches.
const DOM_TARGET_KEYS = ['text', 'containing', 'row', 'column', 'nth'];
// Steps whose target is the step's value (a string or a target object).
const TARGET_STEP_KEYS = ['click', 'fill', 'select'];
const TARGET_EXPECT_KEYS = ['visible', 'hidden'];

function findDomTargetKey(target) {
  if (!type.isObject(target)) {
    return undefined;
  }
  return DOM_TARGET_KEYS.find((key) => Object.hasOwn(target, key));
}

// Why a step needs a browser, or undefined when a headless run can take it.
function needsBrowser(step) {
  const key = getStepKey(step);
  if (!HEADLESS_STEP_KEYS.includes(key)) {
    return `step "${key}" needs a browser`;
  }
  if (key === 'press' && step.press !== 'Enter') {
    return `press "${step.press}" needs a browser; a headless run presses only Enter`;
  }
  if (TARGET_STEP_KEYS.includes(key)) {
    const target = step[key];
    const domKey = findDomTargetKey(target);
    if (!type.isUndefined(domKey)) {
      return `a target by "${domKey}" reads the page; a headless run targets blocks by blockId`;
    }
    if (type.isObject(target) && Object.hasOwn(target, 'fromEmail')) {
      return 'a fill from an email reads the mail sink in a browser journey';
    }
    if (type.isObject(target) && type.isInt(target.count) && target.count > 1) {
      return 'a double or triple click needs a browser';
    }
    return undefined;
  }
  if (key !== 'expect') {
    return undefined;
  }
  const expectKey = getStepKey(step.expect);
  if (!HEADLESS_EXPECT_KEYS.includes(expectKey)) {
    return `expect "${expectKey}" reads the page in a browser`;
  }
  if (TARGET_EXPECT_KEYS.includes(expectKey)) {
    const domKey = findDomTargetKey(step.expect[expectKey]);
    if (!type.isUndefined(domKey)) {
      return `a target by "${domKey}" reads the page; a headless run targets blocks by blockId`;
    }
  }
  return undefined;
}

// Whether a journey can run headless, read from its steps alone: { headless: true }, or
// { headless: false, index, step, reason } for the first step that needs a browser. A step
// may still turn out to need one at run time (an action only a browser can carry out), which the
// headless runner reports. Runs on a journey whose steps validateJourneySteps accepted.
function classifyJourney({ journey }) {
  const steps = normaliseJourneySteps({ steps: journey.steps ?? [] });
  for (let index = 0; index < steps.length; index += 1) {
    const reason = needsBrowser(steps[index]);
    if (!type.isUndefined(reason)) {
      return { headless: false, index, step: journey.steps[index], reason };
    }
  }
  return { headless: true };
}

export default classifyJourney;
