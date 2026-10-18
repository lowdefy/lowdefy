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
import path from 'path';

const toolFolders = { adb: 'platform-tools', emulator: 'emulator' };

// The Android SDK's tools are often not on PATH: Android Studio installs them
// under the SDK folder that ANDROID_HOME (or the older ANDROID_SDK_ROOT) names.
function findAndroidTool({ name }) {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdk) {
    const file = process.platform === 'win32' ? `${name}.exe` : name;
    const toolPath = path.join(sdk, toolFolders[name], file);
    if (fs.existsSync(toolPath)) {
      return toolPath;
    }
  }
  return name;
}

export default findAndroidTool;
