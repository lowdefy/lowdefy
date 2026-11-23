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

// The keys of a target that read the page, as the message names them.
function pageKeys(target) {
  return [...PAGE_KEYS, 'row'].filter((key) => Object.hasOwn(target, key));
}

// The control a click that reads the page landed on in the journey's measured browser run: the
// clicked element carried its control marks (a ClickableHtml element by its data-event and
// data-id, a grid cell's button, a modal's ok), which the browser runner records
// (exercised.controls), else null. The measured run is of this journey as written (readExercised
// checks its hash), so its step indexes are this journey's.
function readRecordedControl({ exercisedEntry, index, step }) {
  const target = readTarget(step);
  if (getStepKey(step) !== 'click' || !type.isObject(target) || pageKeys(target).length === 0) {
    return null;
  }
  const controls = exercisedEntry?.exercised?.controls ?? [];
  const control = controls.find((recorded) => recorded.stepIndex === index);
  if (type.isUndefined(control)) {
    return null;
  }
  const controlTarget = { blockId: control.blockId, control: control.control };
  if (!type.isNone(control.rowKey)) {
    controlTarget.rowKey = control.rowKey;
  }
  return controlTarget;
}

function keepTarget([targetKey]) {
  return !PAGE_KEYS.includes(targetKey);
}

function replaceTarget(step) {
  const key = getStepKey(step);
  if (key === 'expect') {
    const expectation = getStepKey(step.expect);
    return {
      expect: {
        [expectation]: Object.fromEntries(
          Object.entries(step.expect[expectation]).filter(keepTarget)
        ),
      },
    };
  }
  return { [key]: Object.fromEntries(Object.entries(step[key]).filter(keepTarget)) };
}

// What L8 would write in place of a step: the recorded control when its measured run clicked
// one, else the blockId alone when that names the same control, else nothing.
function findReplacement({ exercisedEntry, index, step }) {
  const control = readRecordedControl({ exercisedEntry, index, step });
  if (control !== null) {
    const count = type.isUndefined(step.click.count) ? {} : { count: step.click.count };
    return { kind: 'control', target: control, step: { click: { ...control, ...count } } };
  }
  if (isReplaceable(readTarget(step))) {
    return { kind: 'block', step: replaceTarget(step) };
  }
  return null;
}

function formatTarget(target) {
  return `{ ${Object.entries(target)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')} }`;
}

function describeProblem({ replacement, step, index }) {
  const target = readTarget(step);
  const keys = pageKeys(target).join(' and ');
  const names = type.isString(target.blockId) ? ` names block "${target.blockId}" and` : '';
  if (replacement.kind === 'control') {
    return `${describeStep({ step, index })}${names} reads the page for its ${keys}: target ${formatTarget(
      replacement.target
    )}, the control its measured run clicked, and the journey runs headless.`;
  }
  return `${describeStep({ step, index })}${names} reads the page for its ${keys}: target { blockId: ${
    target.blockId
  } } alone and the journey runs headless.`;
}

// L8: a journey that runs only in the browser, and only because some of its targets read the page
// (text, containing, nth or row), could run headless, the fast level, if those targets named
// their control by key. Each such step is reported with the target to use: the control its
// measured browser run clicked (a ClickableHtml element's { blockId, control, rowKey }), else the
// blockId alone where the target already names its block and no grid row or cell. A check of
// what the person sees (expect: { text }) is never reported: under
// write-journeys-assert-the-store a write journey proves its write with expect: { db }, and a text
// check is the optional browser check of what the page shows, the journey's to keep.
function L8({ journey, exercisedEntry }) {
  if (classifyJourney({ journey }).headless) {
    return [];
  }
  const replacements = journey.steps.map((step, index) =>
    findReplacement({ exercisedEntry, index, step })
  );
  const replaced = journey.steps.map((step, index) => replacements[index]?.step ?? step);
  if (!classifyJourney({ journey: { ...journey, steps: replaced } }).headless) {
    return [];
  }
  return journey.steps.flatMap((step, index) => {
    const replacement = replacements[index];
    if (replacement === null) {
      return [];
    }
    return [
      {
        severity: 'warning',
        stepIndex: index,
        message: describeProblem({ replacement, step, index }),
      },
    ];
  });
}

export default L8;
