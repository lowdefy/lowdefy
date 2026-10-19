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

// The app's package.json scripts that run `lowdefy dev`.
function findDevScripts({ configDirectory }) {
  const packageJsonPath = path.join(configDirectory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return { scripts: {}, matching: [] };
  }
  const scripts = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).scripts ?? {};
  const matching = Object.keys(scripts).filter((name) => scripts[name].includes('lowdefy dev'));
  return { scripts, matching };
}

export default findDevScripts;
