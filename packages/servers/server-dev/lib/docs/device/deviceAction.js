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

import injectDevice from './injectDevice.js';
import listDevices from './listDevices.js';
import startDevice from './startDevice.js';
import { listTabs } from '../tabChannel.js';

const ACTIONS = ['list', 'start', 'inject'];

async function listPhones({ devices }) {
  const phones = listTabs()
    .filter((tab) => !type.isNone(tab.device))
    .map(({ id, device, pageId, pathParams, connectedAt }) => ({
      device: id,
      platform: device.platform,
      app: device.app,
      shell: device.shell,
      paired: device.paired,
      pageId,
      pathParams,
      connectedAt,
    }));
  return { phones, ...(await listDevices(devices)) };
}

/**
 * The lowdefy_device tool:
 * - `list`: the phones connected as tabs (Lowdefy Dev), each with the tab id the other tools take
 *   as `device`, and the booted simulators and Android devices on this computer.
 * - `start`: opens Lowdefy Dev on a simulator or Android device (startDevice).
 * - `inject`: fakes a phone's next device result (injectDevice).
 * Resolves the action's result, or `{ error }`.
 *
 * @param {Object} params
 * @param {string} params.action
 * @param {string} [params.device] The phone's tab id, for inject.
 * @param {string} [params.platform] 'ios' or 'android', for start.
 * @param {Object} [params.inject] `{ kind, value, name }`, for inject.
 * @param {string} params.origin This dev server's URL on this computer.
 * @param {Object} [params.devices] Options for listDevices (`adb`, `platform`, `run`).
 * @param {(message: string) => void} [params.log]
 */
async function deviceAction({ action, device, platform, inject, origin, devices = {}, log }) {
  switch (action) {
    case 'list':
      return listPhones({ devices });
    case 'start':
      return startDevice({ platform, origin, log, run: devices.run });
    case 'inject':
      return injectDevice({ device, inject, devices, run: devices.run });
    default:
      return {
        error: `"action" must be one of ${ACTIONS.join(', ')}. Received ${JSON.stringify(action)}.`,
      };
  }
}

export default deviceAction;
