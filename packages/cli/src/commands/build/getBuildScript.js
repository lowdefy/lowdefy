/*
  Copyright 2020 Lowdefy, Inc

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
import loadModule from '../../utils/loadModule';

async function getBuildScript(version) {
  let buildScript;
  const cleanVersion = version.replace(/[-.]/g, '_');
  const cachePath = path.resolve(process.cwd(), `./.lowdefy/.cache/build/v${cleanVersion}`);
  if (fs.existsSync(cachePath)) {
    buildScript = await loadModule(cachePath, './build');
    return buildScript.default;
  }
  return null;
}

export default getBuildScript;
