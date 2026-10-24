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

// The privacy services `xcrun simctl privacy` grants and revokes. A permission
// the simulator has no service for (a camera: simulators have none) is left to
// Lowdefy Dev's own answer.
const SIMCTL_PRIVACY_SERVICES = [
  'calendar',
  'contacts',
  'location',
  'location-always',
  'media-library',
  'microphone',
  'motion',
  'photos',
  'photos-add',
  'reminders',
  'siri',
];

function formatCoordinate({ latitude, longitude }) {
  return `${latitude},${longitude}`;
}

function simulatorLocationArgs({ udid, value }) {
  const route = type.isArray(value) ? value : [value];
  if (route.length === 1) {
    return ['simctl', 'location', udid, 'set', formatCoordinate(route[0])];
  }
  // `start` moves the simulator along the waypoints at walking pace (its default speed).
  return ['simctl', 'location', udid, 'start', ...route.map(formatCoordinate)];
}

/**
 * The command line of one simulator or emulator operation, as `{ command, args, encoding? }` for
 * runDeviceTool. Built apart from running it, so each is checked without a simulator.
 *
 * - `list-simulators`: the booted iOS simulators, as JSON.
 * - `list-android`: the Android devices adb sees, emulators and USB phones (`adb devices -l`).
 * - `simulator-screenshot`: a PNG of the simulator's screen written to `file`.
 * - `android-screenshot`: a PNG of the device's screen on stdout (a Buffer).
 * - `simulator-location`: `value` is `{ latitude, longitude }` (set) or a list of them (a route).
 * - `simulator-push`: the push payload in `file` delivered to `bundleId`.
 * - `simulator-privacy`: `answer` 'granted' grants and 'denied' revokes `service` for `bundleId`.
 *
 * @param {Object} params
 * @param {string} params.action
 * @param {string} [params.adb] The adb executable (findAndroidTool).
 * @param {string} [params.udid] The simulator.
 * @param {string} [params.serial] The Android device.
 */
function buildDeviceCommand({ action, adb, answer, bundleId, file, serial, service, udid, value }) {
  switch (action) {
    case 'list-simulators':
      return { command: 'xcrun', args: ['simctl', 'list', 'devices', 'booted', '--json'] };
    case 'list-android':
      return { command: adb, args: ['devices', '-l'] };
    case 'simulator-screenshot':
      return { command: 'xcrun', args: ['simctl', 'io', udid, 'screenshot', '--type=png', file] };
    case 'android-screenshot':
      return {
        command: adb,
        args: ['-s', serial, 'exec-out', 'screencap', '-p'],
        encoding: 'buffer',
      };
    case 'simulator-location':
      return { command: 'xcrun', args: simulatorLocationArgs({ udid, value }) };
    case 'simulator-push':
      return { command: 'xcrun', args: ['simctl', 'push', udid, bundleId, file] };
    case 'simulator-privacy':
      return {
        command: 'xcrun',
        args: [
          'simctl',
          'privacy',
          udid,
          answer === 'granted' ? 'grant' : 'revoke',
          service,
          bundleId,
        ],
      };
    default:
      throw new Error(`Unknown device command. Received ${JSON.stringify(action)}.`);
  }
}

export { SIMCTL_PRIVACY_SERVICES };
export default buildDeviceCommand;
