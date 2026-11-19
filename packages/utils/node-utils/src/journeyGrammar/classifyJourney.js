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
  'hold',
  'open',
  'press',
  'release',
  'request',
  'select',
  'wait',
  'webhook',
];
// Steps only the headless runner takes: it keeps a held call parked in its own process while the
// steps after the hold run, which a browser posting to the server cannot.
const IN_PROCESS_STEP_KEYS = ['hold', 'release'];

// Why a step only the runner in process can take needs it, or undefined for any other step. A
// call as system runs the endpoint as a cron run does, which over HTTP is the detached route, and
// that route answers only a caller holding CRON_SECRET.
function needsInProcess(step) {
  const key = getStepKey(step);
  if (IN_PROCESS_STEP_KEYS.includes(key)) {
    return `step "${key}" needs the headless runner, which keeps a held call parked in its own process`;
  }
  if (key === 'call' && step.call.as === 'system') {
    return 'step "call" as system needs the headless runner, which runs the endpoint as the system in its own process; over HTTP that is the detached route, which needs CRON_SECRET';
  }
  return undefined;
}
// Checks a headless run reads from the engine, the calls it recorded or the data session.
const HEADLESS_EXPECT_KEYS = [
  'calls',
  'db',
  'error',
  'hidden',
  'state',
  'status',
  'sunk',
  'url',
  'visible',
];
// Target keys that read the DOM: a control's text, a grid row as displayed or a column of it, a
// pick among matches. A column in a row named by rowKey is read from the grid's data, as rowKey
// and control are, so it is a DOM key only without rowKey.
const DOM_TARGET_KEYS = ['text', 'containing', 'row', 'column', 'nth'];
// Steps whose target is the step's value (a string or a target object).
const TARGET_STEP_KEYS = ['click', 'fill', 'open', 'select'];
const TARGET_EXPECT_KEYS = ['visible', 'hidden'];

function findDomTargetKey(target) {
  if (!type.isObject(target)) {
    return undefined;
  }
  return DOM_TARGET_KEYS.find(
    (key) => Object.hasOwn(target, key) && !(key === 'column' && Object.hasOwn(target, 'rowKey'))
  );
}

// Why a target by a DOM key needs a browser, naming the key that runs headless where there is
// one.
function domTargetReason(domKey) {
  if (domKey === 'row') {
    return 'a target by row reads the displayed order; name the row with rowKey to run headless';
  }
  if (domKey === 'text') {
    return 'a target by text reads the page; name the control with control on its block';
  }
  return `a target by "${domKey}" reads the page; a headless run targets blocks by blockId`;
}

// Steps that leave the focus where it is: a press goes to the element the step before them
// focused.
const FOCUS_KEEPING_STEP_KEYS = ['expect', 'wait'];

// The key of the last step before `index` that can move the focus, or undefined when there is
// none.
function findFocusStepKey({ steps, index }) {
  for (let before = index - 1; before >= 0; before -= 1) {
    const key = getStepKey(steps[before]);
    if (!FOCUS_KEEPING_STEP_KEYS.includes(key)) {
      return key;
    }
  }
  return undefined;
}

// Why a step needs a browser, or undefined when a headless run can take it.
function needsBrowser({ steps, index }) {
  const step = steps[index];
  const key = getStepKey(step);
  if (!HEADLESS_STEP_KEYS.includes(key)) {
    return `step "${key}" needs a browser`;
  }
  if (key === 'press' && step.press !== 'Enter') {
    return `press "${step.press}" needs a browser; a headless run presses only Enter`;
  }
  // A browser presses Enter on whatever has the focus; a headless run presses it on the input
  // filled last, which has the focus only when the fill is the step before it.
  if (key === 'press' && findFocusStepKey({ steps, index }) !== 'fill') {
    return 'press "Enter" needs a browser unless a fill comes straight before it';
  }
  if (TARGET_STEP_KEYS.includes(key)) {
    const target = step[key];
    const domKey = findDomTargetKey(target);
    if (!type.isUndefined(domKey)) {
      return domTargetReason(domKey);
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
      return domTargetReason(domKey);
    }
  }
  return undefined;
}

// The first step only the runner in process can take, as { index, step, reason }, or undefined.
function findInProcessStep({ journey, steps }) {
  const index = steps.findIndex((step) => !type.isUndefined(needsInProcess(step)));
  if (index === -1) {
    return undefined;
  }
  return { index, step: journey.steps[index], reason: needsInProcess(steps[index]) };
}

// Whether a journey can run headless, read from its steps alone: { headless: true }, or
// { headless: false, index, step, reason } for the first step that needs a browser. A step
// may still turn out to need one at run time (an action only a browser can carry out), which the
// headless runner reports. A journey with a step only the runner in process takes (hold,
// release, a call as system) also carries inProcess: { index, step, reason } for the first, which a browser run
// refuses. Runs on a journey whose steps validateJourneySteps accepted.
function classifyJourney({ journey }) {
  const steps = normaliseJourneySteps({ steps: journey.steps ?? [] });
  const inProcess = findInProcessStep({ journey, steps });
  const needs = type.isUndefined(inProcess) ? {} : { inProcess };
  for (let index = 0; index < steps.length; index += 1) {
    const reason = needsBrowser({ steps, index });
    if (!type.isUndefined(reason)) {
      return { headless: false, index, step: journey.steps[index], reason, ...needs };
    }
  }
  return { headless: true, ...needs };
}

export default classifyJourney;
