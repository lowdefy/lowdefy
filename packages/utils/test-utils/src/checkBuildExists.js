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

import fs from 'node:fs';
import path from 'node:path';

import buildCommand from './buildCommand.js';

// appMeta.json is written by every build, so a build folder without it is a build that never
// finished, which is refused like a missing one.
function checkBuildExists({ directories }) {
  if (!fs.existsSync(path.join(directories.build, 'appMeta.json'))) {
    throw new Error(
      `No Lowdefy build found at "${directories.build}". Run "${buildCommand}" in the app's directory, then run the tests again. If the app builds its server somewhere else, pass serverDirectory to openTestApp.`
    );
  }
  if (!fs.existsSync(path.join(directories.server, 'node_modules'))) {
    throw new Error(
      `The Lowdefy server at "${directories.server}" has no node_modules, so its packages can not be loaded. Run "${buildCommand}" in the app's directory, which installs them, then run the tests again.`
    );
  }
}

export default checkBuildExists;
