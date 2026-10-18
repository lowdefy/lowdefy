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

import { spawn } from 'child_process';

import { wait } from '@lowdefy/helpers';

import runDeviceTool from './runDeviceTool.js';

const BOOT_TIMEOUT_MS = 180000;

function listConnectedDevices(output) {
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device')
    .map(([serial]) => serial);
}

async function listAvds({ device }) {
  try {
    const output = await runDeviceTool({ command: device.emulator, args: ['-list-avds'] });
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('INFO'));
  } catch {
    return [];
  }
}

async function waitForBoot({ device }) {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  await runDeviceTool({ command: device.adb, args: ['-e', 'wait-for-device'] });
  while (Date.now() < deadline) {
    const booted = await runDeviceTool({
      command: device.adb,
      args: ['-e', 'shell', 'getprop', 'sys.boot_completed'],
    });
    if (booted.trim() === '1') {
      return;
    }
    await wait(2000);
  }
  throw new Error('The Android emulator did not finish booting within 3 minutes.');
}

// A phone on USB (with USB debugging on) or a running emulator is used as it
// is. Otherwise the first Android virtual device is started; it keeps running
// after the dev server stops, as a booted iOS simulator does.
async function findAndroidDevice({ context, device }) {
  const connected = listConnectedDevices(
    await runDeviceTool({ command: device.adb, args: ['devices'] })
  );
  if (connected.length > 0) {
    return connected[0];
  }
  const avds = await listAvds({ device });
  if (avds.length === 0) {
    throw new Error(
      "No Android phone is connected and no emulator is set up. Connect a phone with USB debugging on, or create a virtual device in Android Studio's Device Manager."
    );
  }
  context.logger.info(`Starting the ${avds[0]} Android emulator.`);
  spawn(device.emulator, ['-avd', avds[0]], { detached: true, stdio: 'ignore' }).unref();
  await waitForBoot({ device });
  const started = listConnectedDevices(
    await runDeviceTool({ command: device.adb, args: ['devices'] })
  );
  return started[0];
}

export default findAndroidDevice;
