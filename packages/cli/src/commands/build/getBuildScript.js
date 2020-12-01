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
import fetchNpmTarball from '../../utils/fetchNpmTarball';
import loadModule from '../../utils/loadModule';

async function getBuildScript(context) {
  const cleanVersion = context.version.replace(/[-.]/g, '_');
  const cachePath = path.resolve(context.cacheDirectory, `scripts/build_${cleanVersion}`);
  if (!fs.existsSync(path.resolve(cachePath, 'package/dist/remoteEntry.js'))) {
    await fetchNpmTarball({
      name: '@lowdefy/build',
      version: context.version,
      directory: cachePath,
    });
  }
  const buildScript = await loadModule(path.resolve(cachePath, 'package/dist'), './build');
  context.buildScript = buildScript.default;
  return context;
}

export default getBuildScript;
