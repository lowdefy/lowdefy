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

import { get, type, wait } from '@lowdefy/helpers';
import { getStepKey } from '@lowdefy/node-utils';

import inspectStateFromTab from '../inspectStateFromTab.js';
import isDeepEqual from '../isDeepEqual.js';
import JourneyStepError from '../JourneyStepError.js';
import sendDeviceStep from './sendDeviceStep.js';

// The steps Lowdefy Dev runs itself (shell src/dev/steps/createStepRunner.js), by block id.
const PHONE_STEPS = ['click', 'fill', 'select', 'press', 'wait', 'screenshot'];
const POLL_MS = 100;

function describeUnsupported(step) {
  const key = getStepKey(step);
  if (key === 'expect') {
    return `{"expect": ${JSON.stringify(
      Object.keys(step.expect ?? {})
    )}} (a phone checks only "state")`;
  }
  return `"${key}"`;
}

function isSupported(step) {
  if (!type.isObject(step) || Object.keys(step).length !== 1) {
    return false;
  }
  const key = getStepKey(step);
  if (PHONE_STEPS.includes(key)) {
    return true;
  }
  return (
    key === 'expect' &&
    type.isObject(step.expect) &&
    Object.keys(step.expect).length === 1 &&
    type.isObject(step.expect.state) &&
    type.isString(step.expect.state.path)
  );
}

async function readStateValue({ tabId, path }) {
  const snapshot = await inspectStateFromTab({ tabId });
  if (!type.isUndefined(snapshot.error)) {
    return { error: new Error(snapshot.error) };
  }
  return { value: get(snapshot.state ?? {}, path) ?? null };
}

// Polled, as in the browser: the value a tap leads to often lands once its request has answered.
async function expectState({ tabId, params, stepTimeout }) {
  const { path, equals } = params;
  const deadline = Date.now() + stepTimeout;
  let read = await readStateValue({ tabId, path });
  while (
    (!type.isUndefined(read.error) || !isDeepEqual(read.value, equals)) &&
    Date.now() < deadline
  ) {
    await wait(POLL_MS);
    read = await readStateValue({ tabId, path });
  }
  if (!type.isUndefined(read.error)) {
    throw read.error;
  }
  if (!isDeepEqual(read.value, equals)) {
    throw new JourneyStepError(
      `Expected state "${path}" to equal ${JSON.stringify(equals)} but found ${JSON.stringify(
        read.value
      )}.`,
      { expected: equals, actual: read.value }
    );
  }
}

function toFailure({ error, index, step }) {
  if (error instanceof JourneyStepError) {
    return {
      index,
      step,
      expected: error.expected,
      actual: type.isUndefined(error.actual) ? null : error.actual,
      message: error.message,
    };
  }
  return {
    index,
    step,
    expected: `step ${index} (${getStepKey(step)}) to complete`,
    actual: error.message,
    message: error.message,
  };
}

/**
 * Runs journey steps on a phone, in order, stopping at the first that fails. Lowdefy Dev runs
 * click, fill, select, press, wait and screenshot itself, by block id, through the engine; an
 * `expect: { state }` is read from its live state. Any other step is refused before the first
 * runs, as `{ error }`. Otherwise resolves `{ results, screenshots, failure }`, as the browser's
 * runner does: a failed step is a result, not an error.
 *
 * @param {Object} params
 * @param {string} params.tabId The phone's tab.
 * @param {Object[]} [params.steps]
 * @param {number} [params.stepTimeout] How long each step waits, in ms.
 */
async function runDeviceSteps({ tabId, steps = [], stepTimeout = 5000 }) {
  const unsupported = steps.filter((step) => !isSupported(step));
  if (unsupported.length > 0) {
    return {
      error: `A phone runs the steps ${PHONE_STEPS.join(
        ', '
      )} and expect with "state", by blockId. Not supported on a phone: ${unsupported
        .map(describeUnsupported)
        .join(', ')}.`,
    };
  }
  const results = [];
  const screenshots = [];
  let failure;
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (!type.isUndefined(failure)) {
      results.push({ index, step, status: 'skipped', durationMs: 0 });
      continue;
    }
    const started = Date.now();
    try {
      if (getStepKey(step) === 'expect') {
        await expectState({ tabId, params: step.expect.state, stepTimeout });
      } else {
        const answer = await sendDeviceStep({ tabId, step, stepTimeout });
        if (getStepKey(step) === 'screenshot') {
          screenshots.push({
            name: type.isString(step.screenshot) ? step.screenshot : `step-${index}`,
            data: answer.image,
            mimeType: 'image/png',
          });
        }
      }
      results.push({ index, step, status: 'ok', durationMs: Date.now() - started });
    } catch (error) {
      failure = toFailure({ error, index, step });
      results.push({ index, step, status: 'failed', durationMs: Date.now() - started });
    }
  }
  return { results, screenshots, failure };
}

export { PHONE_STEPS };
export default runDeviceSteps;
