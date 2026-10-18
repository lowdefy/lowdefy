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

import { findAndroidTool } from '@lowdefy/node-utils';

import listDevices from './listDevices.js';

/**
 * What can reach a phone tab from outside the app, for the operations a simulator or emulator does
 * more faithfully than Lowdefy Dev itself (a screenshot with the system UI, a real location or
 * push). Resolves one of:
 * - `{ kind: 'simulator', udid, name }`: the one booted iOS simulator (`xcrun simctl`).
 * - `{ kind: 'android', serial, emulator, adb }`: the one Android device adb sees, an emulator or a
 *   USB phone through adb reverse.
 * - `{ kind: 'view', reason }`: only Lowdefy Dev itself: a phone paired over the network, or no
 *   single simulator or device it could be.
 * A tab on this computer's localhost is a simulator or an adb-reversed device, but with several
 * booted the dev server cannot tell which one the tab is in, so it uses Lowdefy Dev's own capture.
 *
 * @param {Object} params
 * @param {Object} params.tab The registered tab (tabChannel getTab), with its `device`.
 * @param {Object} [params.devices] Options for listDevices (`run`, `adb`, `platform`).
 */
async function findDeviceTarget({ tab, devices = {} }) {
  const { platform, paired } = tab.device;
  if (paired) {
    return { kind: 'view', reason: 'the phone is paired over the network' };
  }
  if (platform !== 'ios' && platform !== 'android') {
    return { kind: 'view', reason: 'Lowdefy Dev did not report its platform' };
  }
  const adb = devices.adb ?? findAndroidTool({ name: 'adb' });
  const listed = await listDevices({ ...devices, adb });
  if (platform === 'ios') {
    if (listed.simulators.length === 1) {
      const [{ udid, name }] = listed.simulators;
      return { kind: 'simulator', udid, name };
    }
    return {
      kind: 'view',
      reason:
        listed.simulators.length === 0
          ? `no booted iOS simulator was found (${listed.unavailable.join(' ') || 'none booted'})`
          : `${listed.simulators.length} iOS simulators are booted, and the tab could be in any`,
    };
  }
  if (listed.android.length === 1) {
    const [{ serial, emulator }] = listed.android;
    return { kind: 'android', serial, emulator, adb };
  }
  return {
    kind: 'view',
    reason:
      listed.android.length === 0
        ? `adb lists no Android device (${listed.unavailable.join(' ') || 'none connected'})`
        : `adb lists ${listed.android.length} Android devices, and the tab could be on any`,
  };
}

export default findDeviceTarget;
