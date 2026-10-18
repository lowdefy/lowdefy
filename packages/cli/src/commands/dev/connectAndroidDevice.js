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

import createDevAppLink from './createDevAppLink.js';
import findAndroidDevice from './findAndroidDevice.js';
import runDeviceTool from './runDeviceTool.js';

// adb reverse makes the device's localhost:<port> the Mac's, for an emulator
// and a USB phone alike, so Lowdefy Dev reaches the dev server on localhost
// without the network and without pairing.
async function connectAndroidDevice({ context, device, ready }) {
  const serial = await findAndroidDevice({ context, device });
  await runDeviceTool({
    command: device.adb,
    args: ['-s', serial, 'install', '-r', device.appPath],
  });
  const instance = await ready;
  if (instance === null) {
    return;
  }
  const port = String(instance.port);
  await runDeviceTool({
    command: device.adb,
    args: ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`],
  });
  // adb shell runs its arguments through the device's shell: quote the link,
  // whose ? and & the shell would otherwise read.
  const link = createDevAppLink({ url: instance.url });
  await runDeviceTool({
    command: device.adb,
    args: [
      '-s',
      serial,
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-d',
      `'${link}'`,
    ],
  });
  context.logger.info(`Opened ${instance.url} in Lowdefy Dev on Android device ${serial}.`);
}

export default connectAndroidDevice;
