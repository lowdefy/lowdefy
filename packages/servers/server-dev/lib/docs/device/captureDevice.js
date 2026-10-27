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

import { runDeviceTool } from '@lowdefy/node-utils';

import buildDeviceCommand from './buildDeviceCommand.js';
import sendDeviceStep from './sendDeviceStep.js';

async function captureSimulator({ run, udid }) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'lowdefy-device-'));
  const file = path.join(directory, 'screen.png');
  try {
    await run(buildDeviceCommand({ action: 'simulator-screenshot', udid, file }));
    return (await fs.promises.readFile(file)).toString('base64');
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
}

async function captureAndroid({ adb, run, serial }) {
  const png = await run(buildDeviceCommand({ action: 'android-screenshot', adb, serial }));
  return Buffer.from(png).toString('base64');
}

async function captureView({ tabId, reason }) {
  const { image } = await sendDeviceStep({ tabId, step: { screenshot: null } });
  return {
    data: image,
    mimeType: 'image/png',
    capture: 'view',
    note: `Captured by Lowdefy Dev from the app's own view, without the system UI, because ${reason}.`,
  };
}

/**
 * A PNG of what a phone tab shows, as `{ data (base64), mimeType, capture, note? }`. A simulator
 * is captured with `xcrun simctl io` and an Android device with `adb exec-out screencap`, which
 * show the whole screen with system dialogs and alerts. A phone paired over the network, or one
 * the tools cannot reach, is captured by Lowdefy Dev itself (`capture: 'view'`), with a note why.
 *
 * @param {Object} params
 * @param {Object} params.tab The phone's tab (findDeviceTab).
 * @param {Object} params.target Where it runs (findDeviceTarget).
 * @param {Function} [params.run] Runs one device command (runDeviceTool).
 */
async function captureDevice({ tab, target, run = runDeviceTool }) {
  try {
    if (target.kind === 'simulator') {
      return {
        data: await captureSimulator({ run, udid: target.udid }),
        mimeType: 'image/png',
        capture: 'simctl',
      };
    }
    if (target.kind === 'android') {
      return {
        data: await captureAndroid({ adb: target.adb, run, serial: target.serial }),
        mimeType: 'image/png',
        capture: 'adb',
      };
    }
  } catch (error) {
    return captureView({ tabId: tab.id, reason: `the device tool failed (${error.message})` });
  }
  return captureView({ tabId: tab.id, reason: target.reason });
}

export default captureDevice;
