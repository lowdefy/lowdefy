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

import fs from 'fs';
import os from 'os';
import path from 'path';

import { type } from '@lowdefy/helpers';
import { runDeviceTool } from '@lowdefy/node-utils';

import buildDeviceCommand, { SIMCTL_PRIVACY_SERVICES } from './buildDeviceCommand.js';
import findDeviceTab from './findDeviceTab.js';
import findDeviceTarget from './findDeviceTarget.js';
import { requestFromTab } from '../tabChannel.js';

// The kinds an iOS simulator also does itself, more faithfully than Lowdefy Dev's own answer.
const SIMULATOR_KINDS = ['location', 'push', 'permission'];

// Lowdefy Dev's bundle id (shell.dev.json), for a shell that did not report its own.
const LOWDEFY_DEV_APP_ID = 'com.lowdefy.dev';

function appId(tab) {
  return tab.device.app ?? LOWDEFY_DEV_APP_ID;
}

async function runWithFile({ contents, task }) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'lowdefy-device-'));
  const file = path.join(directory, 'payload.json');
  try {
    await fs.promises.writeFile(file, contents);
    return await task(file);
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
}

// An APNs payload ({ aps }) on a simulator is delivered by simctl alone, as Apple's push service
// would deliver it. Any other push goes to Lowdefy Dev, which shows it with expo-notifications and
// can tap it or press a button.
function isApnsPayload(value) {
  return type.isObject(value) && type.isObject(value.aps);
}

async function pushToSimulator({ tab, target, value, run }) {
  await runWithFile({
    contents: JSON.stringify(value),
    task: (file) =>
      run(
        buildDeviceCommand({
          action: 'simulator-push',
          udid: target.udid,
          bundleId: appId(tab),
          file,
        })
      ),
  });
  return { ok: true, kind: 'push', via: 'simctl', simulator: target.name };
}

async function applyOnSimulator({ tab, target, kind, name, value, run }) {
  if (kind === 'location') {
    await run(buildDeviceCommand({ action: 'simulator-location', udid: target.udid, value }));
    return { ok: true, simulator: target.name };
  }
  if (!SIMCTL_PRIVACY_SERVICES.includes(name)) {
    return {
      ok: false,
      note: `The simulator has no privacy service "${name}" (simctl privacy knows ${SIMCTL_PRIVACY_SERVICES.join(
        ', '
      )}), so only Lowdefy Dev's answer was set.`,
    };
  }
  await run(
    buildDeviceCommand({
      action: 'simulator-privacy',
      udid: target.udid,
      answer: value,
      service: name,
      bundleId: appId(tab),
    })
  );
  return {
    ok: true,
    simulator: target.name,
    note: 'iOS may restart the app when a permission changes; Lowdefy Dev then joins as a new tab (lowdefy_device list).',
  };
}

/**
 * lowdefy_device `inject`: fakes the phone's next device result. The injection goes to Lowdefy
 * Dev's dev-tab client (`inject`, `{ kind, value, name }`), which device actions read, so it works
 * on every phone. On an iOS simulator a location and a permission are also set on the simulator
 * (`xcrun simctl location`, `simctl privacy`), and an APNs payload ({ aps }) is delivered by
 * `simctl push` alone; any other push is shown by Lowdefy Dev.
 * Resolves `{ device, kind, app, simulator? }` (what Lowdefy Dev answered, and what the simulator
 * did), or `{ error }` with Lowdefy Dev's own message for an injection it refused.
 *
 * @param {Object} params
 * @param {string} params.device The phone's tab id.
 * @param {Object} params.inject `{ kind, value, name }`.
 * @param {Object} [params.devices] Options for listDevices (`adb`, `platform`).
 * @param {Function} [params.run] Runs one device command (runDeviceTool).
 */
async function injectDevice({ device, inject, devices = {}, run = runDeviceTool }) {
  const { tab, error } = findDeviceTab({ device });
  if (!type.isUndefined(error)) {
    return { error };
  }
  if (!type.isObject(inject) || !type.isString(inject.kind)) {
    return {
      error: `"inject" must be { kind, value, name }, kind one of scan, photo, nfc, transcript, location, permission, network, push, share, clear. Received ${JSON.stringify(
        inject
      )}.`,
    };
  }
  const { kind, name, value } = inject;
  let target = { kind: 'view' };
  if (tab.device.platform === 'ios' && !tab.device.paired && SIMULATOR_KINDS.includes(kind)) {
    target = await findDeviceTarget({ tab, devices: { ...devices, run } });
  }
  if (target.kind === 'simulator' && kind === 'push' && isApnsPayload(value)) {
    try {
      return { device: tab.id, ...(await pushToSimulator({ tab, target, value, run })) };
    } catch (pushError) {
      return { error: pushError.message };
    }
  }
  const answer = await requestFromTab({
    tabId: tab.id,
    event: 'inject',
    payload: { inject: { kind, value, name } },
  });
  if (!type.isUndefined(answer?.error)) {
    return { error: answer.error };
  }
  const result = { device: tab.id, kind, app: answer };
  if (target.kind === 'simulator') {
    try {
      result.simulator = await applyOnSimulator({ tab, target, kind, name, value, run });
    } catch (simulatorError) {
      result.simulator = { ok: false, error: simulatorError.message };
    }
  }
  return result;
}

export default injectDevice;
