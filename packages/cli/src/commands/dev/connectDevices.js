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

import connectAndroidDevice from './connectAndroidDevice.js';
import connectIosSimulator from './connectIosSimulator.js';
import waitForDevServerReady from './waitForDevServerReady.js';

const connectors = { ios: connectIosSimulator, android: connectAndroidDevice };
const labels = { ios: 'the iOS simulator', android: 'Android' };

// Boots and installs while the dev server builds, then opens the app once the
// server answers. A device that fails is reported, and the dev server keeps
// running for the browser and any other device.
function connectDevices({ context, devices, server }) {
  if (devices.length === 0) {
    return Promise.resolve();
  }
  const ready = waitForDevServerReady({ context, server });
  return Promise.all(
    devices.map((device) =>
      connectors[device.platform]({ context, device, ready }).catch((error) => {
        context.logger.error(
          `Could not open Lowdefy Dev on ${labels[device.platform]}: ${error.message}`
        );
      })
    )
  );
}

export default connectDevices;
