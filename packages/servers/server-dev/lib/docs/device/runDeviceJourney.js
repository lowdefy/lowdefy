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

import checkShownPage from './checkShownPage.js';
import findDeviceTab from './findDeviceTab.js';
import inspectStateFromTab from '../inspectStateFromTab.js';
import runDeviceSteps from './runDeviceSteps.js';
import selectFinalState from '../selectFinalState.js';

/**
 * lowdefy_run_journey on a phone: the steps run on the page it shows (runDeviceSteps), and the
 * result has the browser journey's shape: `{ pageId, device, passed, steps, screenshots, state |
 * stateOmitted, failure? }`, with the phone's final page state. Resolves `{ error }` for a call it
 * cannot run (no such phone, another page shown, a step a phone does not run).
 *
 * @param {Object} params
 * @param {string} params.device The phone's tab id.
 * @param {string} params.pageId The page the phone must show when the journey starts.
 * @param {Object} [params.pathParams]
 * @param {Object[]} params.steps
 * @param {number} [params.stepTimeout]
 * @param {boolean|string[]} [params.state] What the result carries of the final state.
 */
async function runDeviceJourney({ device, pageId, pathParams, steps, stepTimeout, state }) {
  const { tab, error } = findDeviceTab({ device });
  if (!type.isUndefined(error)) {
    return { error };
  }
  const notShown = checkShownPage({ tab, pageId, pathParams });
  if (!type.isUndefined(notShown)) {
    return { error: notShown };
  }
  const ran = await runDeviceSteps({ tabId: tab.id, steps, stepTimeout });
  if (!type.isUndefined(ran.error)) {
    return { error: ran.error };
  }
  const snapshot = await inspectStateFromTab({ tabId: tab.id });
  const finalState = type.isUndefined(snapshot.error) ? snapshot.state : { error: snapshot.error };
  const result = {
    pageId,
    device: tab.id,
    passed: type.isUndefined(ran.failure),
    steps: ran.results,
    screenshots: ran.screenshots,
    ...selectFinalState({ state: finalState, selection: state }),
  };
  if (!type.isUndefined(ran.failure)) {
    result.failure = ran.failure;
  }
  return result;
}

export default runDeviceJourney;
