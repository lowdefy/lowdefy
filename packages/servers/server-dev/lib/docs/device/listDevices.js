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

import { findAndroidTool, runDeviceTool } from '@lowdefy/node-utils';

import buildDeviceCommand from './buildDeviceCommand.js';

function parseSimulators(output) {
  const { devices } = JSON.parse(output);
  return Object.entries(devices ?? {})
    .filter(([runtime]) => runtime.includes('.iOS-'))
    .flatMap(([runtime, simulators]) =>
      simulators
        .filter((simulator) => simulator.state === 'Booted')
        .map(({ udid, name }) => ({ udid, name, runtime: runtime.split('.').pop() }))
    );
}

// `adb devices -l`: a header line, then `<serial>  <state> key:value ...` per device.
function parseAndroidDevices(output) {
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device')
    .map(([serial, , ...details]) => {
      const model = details.find((detail) => detail.startsWith('model:'));
      return {
        serial,
        emulator: serial.startsWith('emulator-'),
        model: model === undefined ? null : model.slice('model:'.length),
      };
    });
}

/**
 * The booted iOS simulators and the Android devices (emulators and USB phones) on this computer,
 * as `{ simulators, android, unavailable }`. A tool that is not installed lists nothing, and
 * `unavailable` says which and why, so a Linux machine without Xcode still lists its emulators.
 *
 * @param {Object} [params]
 * @param {string} [params.adb] The adb executable.
 * @param {string} [params.platform] process.platform.
 * @param {Function} [params.run] Runs one device command (runDeviceTool).
 */
async function listDevices({
  adb = findAndroidTool({ name: 'adb' }),
  platform = process.platform,
  run = runDeviceTool,
} = {}) {
  const result = { simulators: [], android: [], unavailable: [] };
  if (platform === 'darwin') {
    try {
      result.simulators = parseSimulators(
        await run(buildDeviceCommand({ action: 'list-simulators' }))
      );
    } catch (error) {
      result.unavailable.push(`iOS simulators: ${error.message}`);
    }
  } else {
    result.unavailable.push('iOS simulators: they run only on macOS.');
  }
  try {
    result.android = parseAndroidDevices(
      await run(buildDeviceCommand({ action: 'list-android', adb }))
    );
  } catch (error) {
    result.unavailable.push(`Android devices: ${error.message}`);
  }
  return result;
}

export default listDevices;
