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

import { requestFromTab } from '../tabChannel.js';

// A step waits up to its own timeout for its block or condition, then up to 5 s for the action
// chain it started to settle (shell src/dev/steps/createStepRunner.js).
const SETTLE_MS = 5000;
const MARGIN_MS = 2000;

/**
 * Runs one journey step on a phone through its dev-tab client (a `step-request`), and resolves
 * what the phone answered: `{ ok, settled }`, or `{ ok, name, image }` for a screenshot step.
 * Throws with the phone's own message when the step could not run.
 *
 * @param {Object} params
 * @param {string} params.tabId
 * @param {Object} params.step One journey step, e.g. `{ click: 'save' }`.
 * @param {number} [params.stepTimeout] How long the phone waits for the step's block or condition.
 */
async function sendDeviceStep({ tabId, step, stepTimeout = 5000 }) {
  const result = await requestFromTab({
    tabId,
    event: 'step-request',
    payload: { step },
    timeout: stepTimeout + SETTLE_MS + MARGIN_MS,
  });
  if (!type.isObject(result)) {
    throw new Error(`The phone answered the step with ${JSON.stringify(result)}.`);
  }
  if (!type.isUndefined(result.error)) {
    throw new Error(result.error);
  }
  return result;
}

export default sendDeviceStep;
