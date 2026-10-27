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

import { bootIosSimulator, createDevAppLink } from '@lowdefy/node-utils';

import runDeviceTool from './runDeviceTool.js';

// A simulator shares the Mac's network, so Lowdefy Dev reaches the dev server
// on localhost and needs no pairing.
async function connectIosSimulator({ context, device, ready }) {
  const simulator = await bootIosSimulator({
    log: (message) => context.logger.info(message),
    run: runDeviceTool,
  });
  await runDeviceTool({
    command: 'xcrun',
    args: ['simctl', 'install', simulator.udid, device.appPath],
  });
  const instance = await ready;
  if (instance === null) {
    return;
  }
  await runDeviceTool({
    command: 'xcrun',
    args: ['simctl', 'openurl', simulator.udid, createDevAppLink({ url: instance.url })],
  });
  context.logger.info(`Opened ${instance.url} in Lowdefy Dev on the ${simulator.name} simulator.`);
}

export default connectIosSimulator;
