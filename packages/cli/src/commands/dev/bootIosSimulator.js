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

import runDeviceTool from './runDeviceTool.js';

function runtimeVersion(runtime) {
  // com.apple.CoreSimulator.SimRuntime.iOS-18-2 -> [18, 2]
  const match = runtime.match(/\.iOS-(\d+)-(\d+)$/);
  return match === null ? [0, 0] : [Number(match[1]), Number(match[2])];
}

function compareRuntimes(a, b) {
  const [aMajor, aMinor] = runtimeVersion(a);
  const [bMajor, bMinor] = runtimeVersion(b);
  return bMajor - aMajor || bMinor - aMinor;
}

// A booted simulator is used as it is. Otherwise the first iPhone on the
// newest iOS runtime is booted and shown in the Simulator app.
async function bootIosSimulator({ context }) {
  const listing = await runDeviceTool({
    command: 'xcrun',
    args: ['simctl', 'list', 'devices', 'available', '--json'],
  });
  const { devices } = JSON.parse(listing);
  const simulators = Object.keys(devices)
    .filter((runtime) => runtime.includes('.iOS-'))
    .sort(compareRuntimes)
    .flatMap((runtime) => devices[runtime]);
  const booted = simulators.find((simulator) => simulator.state === 'Booted');
  if (booted !== undefined) {
    return booted;
  }
  const iphone = simulators.find((simulator) => simulator.name.startsWith('iPhone'));
  if (iphone === undefined) {
    throw new Error(
      'No iPhone simulator is installed. In Xcode, open Settings > Components and install an iOS simulator.'
    );
  }
  context.logger.info(`Booting the ${iphone.name} simulator.`);
  await runDeviceTool({ command: 'xcrun', args: ['simctl', 'boot', iphone.udid] });
  await runDeviceTool({ command: 'open', args: ['-a', 'Simulator'] });
  await runDeviceTool({ command: 'xcrun', args: ['simctl', 'bootstatus', iphone.udid] });
  return iphone;
}

export default bootIosSimulator;
