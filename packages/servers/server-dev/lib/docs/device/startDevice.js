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

import { wait } from '@lowdefy/helpers';
import {
  bootIosSimulator,
  createDevAppLink,
  findAndroidDevice,
  findAndroidTool,
  readDevAppPath,
  runDeviceTool,
} from '@lowdefy/node-utils';

import { listTabs } from '../tabChannel.js';

const PLATFORMS = ['ios', 'android'];
const POLL_MS = 500;

function phoneTabIds() {
  return new Set(
    listTabs()
      .filter((tab) => tab.device !== null && tab.device !== undefined)
      .map((tab) => tab.id)
  );
}

// Lowdefy Dev joins the dev server's tab channel a moment after it opens the link.
async function waitForNewTab({ before, platform, timeout }) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const joined = listTabs().find(
      (tab) => !before.has(tab.id) && tab.device?.platform === platform
    );
    if (joined !== undefined) {
      return joined.id;
    }
    await wait(POLL_MS);
  }
  return null;
}

async function startIos({ hostPlatform, log, origin, run }) {
  if (hostPlatform !== 'darwin') {
    throw new Error('The iOS simulator runs only on macOS. Start an Android emulator instead.');
  }
  const appPath = readDevAppPath({ platform: 'ios' });
  const simulator = await bootIosSimulator({ log, run });
  await run({ command: 'xcrun', args: ['simctl', 'install', simulator.udid, appPath] });
  await run({
    command: 'xcrun',
    args: ['simctl', 'openurl', simulator.udid, createDevAppLink({ url: origin })],
  });
  return { simulator: { udid: simulator.udid, name: simulator.name } };
}

// adb reverse makes the device's localhost:<port> this computer's, so Lowdefy Dev reaches the dev
// server without the network and without pairing. adb shell runs its arguments through the
// device's shell: the link is quoted, whose ? and & the shell would otherwise read.
async function startAndroid({ log, origin, run }) {
  const adb = findAndroidTool({ name: 'adb' });
  const appPath = readDevAppPath({ platform: 'android' });
  const serial = await findAndroidDevice({
    adb,
    emulator: findAndroidTool({ name: 'emulator' }),
    log,
    run,
  });
  const port = new URL(origin).port;
  await run({ command: adb, args: ['-s', serial, 'install', '-r', appPath] });
  await run({ command: adb, args: ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`] });
  await run({
    command: adb,
    args: [
      '-s',
      serial,
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      `'${createDevAppLink({ url: origin })}'`,
    ],
  });
  return { android: { serial } };
}

/**
 * lowdefy_device `start`: what `lowdefy dev --ios` or `--android` does, for a dev server that is
 * already running. It boots a simulator (or uses the booted one), or finds an Android device or
 * starts the first emulator, installs Lowdefy Dev from LOWDEFY_DEV_APP_IOS or
 * LOWDEFY_DEV_APP_ANDROID, and opens it on this dev server. Resolves `{ started, platform, url,
 * simulator | android, device }`, `device` being the tab Lowdefy Dev joined as (null when it has
 * not joined within tabTimeout), or `{ error }`.
 *
 * @param {Object} params
 * @param {string} params.platform 'ios' or 'android'.
 * @param {string} params.origin This dev server's URL on this computer.
 * @param {(message: string) => void} [params.log]
 * @param {Function} [params.run] Runs one device command (runDeviceTool).
 * @param {number} [params.tabTimeout] How long to wait for Lowdefy Dev to join, in ms.
 * @param {string} [params.hostPlatform] process.platform.
 */
async function startDevice({
  platform,
  origin,
  hostPlatform = process.platform,
  log = () => undefined,
  run = runDeviceTool,
  tabTimeout = 30000,
}) {
  if (!PLATFORMS.includes(platform)) {
    return {
      error: `start needs "platform" "ios" or "android". Received ${JSON.stringify(platform)}.`,
    };
  }
  const before = phoneTabIds();
  let started;
  try {
    started =
      platform === 'ios'
        ? await startIos({ hostPlatform, log, origin, run })
        : await startAndroid({ log, origin, run });
  } catch (error) {
    return { error: `Could not start Lowdefy Dev on ${platform}: ${error.message}` };
  }
  const device = await waitForNewTab({ before, platform, timeout: tabTimeout });
  const result = { started: true, platform, url: origin, ...started, device };
  if (device === null) {
    result.note = `Lowdefy Dev opened ${origin} but has not joined as a tab within ${Math.round(
      tabTimeout / 1000
    )} s. Confirm the connection in the app if it asks, then call lowdefy_device with action "list".`;
  }
  return result;
}

export default startDevice;
