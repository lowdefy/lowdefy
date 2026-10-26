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

import { getTab } from '../tabChannel.js';

/**
 * The phone tab a device tool call names: `{ tab }`, or `{ error }` when no tab has that id or the
 * tab is a browser's. `device` is a tab id from lowdefy_device's `list`.
 *
 * @param {Object} params
 * @param {string} params.device
 */
function findDeviceTab({ device }) {
  if (!type.isString(device) || device === '') {
    return {
      error: `"device" must be a tab id from lowdefy_device list. Received ${JSON.stringify(
        device
      )}.`,
    };
  }
  const tab = getTab({ id: device });
  if (type.isNone(tab)) {
    return {
      error: `No phone is connected as tab "${device}". Call lowdefy_device with action "list" for the connected phones; a phone that reconnected has a new tab id.`,
    };
  }
  if (type.isNone(tab.device)) {
    return {
      error: `Tab "${device}" is a browser tab, not a phone. Leave "device" out to use the headless browser, or pass a tab from lowdefy_device list.`,
    };
  }
  return { tab };
}

export default findDeviceTab;
