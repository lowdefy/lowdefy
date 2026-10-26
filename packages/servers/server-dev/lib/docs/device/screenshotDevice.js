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
import { runDeviceTool } from '@lowdefy/node-utils';

import captureDevice from './captureDevice.js';
import checkShownPage from './checkShownPage.js';
import findDeviceTab from './findDeviceTab.js';
import findDeviceTarget from './findDeviceTarget.js';
import runDeviceSteps from './runDeviceSteps.js';

/**
 * lowdefy_screenshot_page on a phone: runs `steps` on it through Lowdefy Dev, then captures its
 * screen (captureDevice). Resolves `{ data, mimeType, capture, note?, failure, screenshots,
 * device }` in the shape screenshotPage gives a browser capture, or `{ error }`.
 *
 * @param {Object} params
 * @param {string} params.device The phone's tab id.
 * @param {string} params.pageId The page the phone must show.
 * @param {Object} [params.pathParams]
 * @param {Object[]} [params.steps]
 * @param {Object} [params.devices] Options for listDevices (`adb`, `platform`).
 * @param {Function} [params.run] Runs one device command (runDeviceTool).
 */
async function screenshotDevice({
  device,
  pageId,
  pathParams,
  steps,
  devices = {},
  run = runDeviceTool,
}) {
  const { tab, error } = findDeviceTab({ device });
  if (!type.isUndefined(error)) {
    return { error };
  }
  const notShown = checkShownPage({ tab, pageId, pathParams });
  if (!type.isUndefined(notShown)) {
    return { error: notShown };
  }
  const ran = await runDeviceSteps({ tabId: tab.id, steps });
  if (!type.isUndefined(ran.error)) {
    return { error: ran.error };
  }
  try {
    const target = await findDeviceTarget({ tab, devices: { ...devices, run } });
    const capture = await captureDevice({ tab, target, run });
    return { ...capture, failure: ran.failure, screenshots: ran.screenshots, device: tab.id };
  } catch (captureError) {
    return { error: `Could not capture the phone on tab "${tab.id}": ${captureError.message}` };
  }
}

export default screenshotDevice;
