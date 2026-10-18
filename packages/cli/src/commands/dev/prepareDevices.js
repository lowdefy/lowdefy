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

import checkAndroidTools from './checkAndroidTools.js';
import checkIosTools from './checkIosTools.js';
import readDevAppPath from './readDevAppPath.js';

// Checked before the dev server is installed or started, so a missing tool or
// build stops `lowdefy dev` at once with the step that fixes it.
async function prepareDevices({ context }) {
  const devices = [];
  if (context.options.ios) {
    await checkIosTools();
    devices.push({ platform: 'ios', appPath: readDevAppPath({ platform: 'ios' }) });
  }
  if (context.options.android) {
    const tools = await checkAndroidTools();
    devices.push({
      platform: 'android',
      appPath: readDevAppPath({ platform: 'android' }),
      ...tools,
    });
  }
  return devices;
}

export default prepareDevices;
