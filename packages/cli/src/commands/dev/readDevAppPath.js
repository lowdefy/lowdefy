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

import { type } from '@lowdefy/helpers';

// Lowdefy Dev release builds are not published yet, so --ios and --android
// install the build these variables point at.
const devApps = {
  ios: { variable: 'LOWDEFY_DEV_APP_IOS', build: 'a Lowdefy Dev simulator build (.app)' },
  android: { variable: 'LOWDEFY_DEV_APP_ANDROID', build: 'a Lowdefy Dev Android build (.apk)' },
};

function readDevAppPath({ platform }) {
  const { variable, build } = devApps[platform];
  const appPath = process.env[variable];
  if (type.isNone(appPath) || appPath === '') {
    throw new Error(
      `Set ${variable} to the path of ${build}. Lowdefy Dev release builds are not published yet, so --${platform} installs the build this variable names.`
    );
  }
  if (!fs.existsSync(appPath)) {
    throw new Error(`${variable} names "${appPath}", which does not exist.`);
  }
  return appPath;
}

export default readDevAppPath;
