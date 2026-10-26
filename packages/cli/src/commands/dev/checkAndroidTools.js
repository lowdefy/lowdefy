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

import runDeviceTool from './runDeviceTool.js';

const INSTALL_ADB =
  '--android needs adb from the Android SDK. Install Android Studio (https://developer.android.com/studio), or only the SDK platform tools (https://developer.android.com/tools/releases/platform-tools), then put platform-tools on your PATH or set ANDROID_HOME to the SDK folder.';

async function checkAndroidTools() {
  const adb = findAndroidTool({ name: 'adb' });
  try {
    await runDeviceTool({ command: adb, args: ['version'] });
  } catch (error) {
    throw new Error(INSTALL_ADB, { cause: error });
  }
  return { adb, emulator: findAndroidTool({ name: 'emulator' }) };
}

export default checkAndroidTools;
