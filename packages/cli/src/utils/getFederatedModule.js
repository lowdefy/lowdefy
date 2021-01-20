/*
  Copyright 2020-2021 Lowdefy, Inc

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
import fetchNpmTarball from './fetchNpmTarball';
import loadModule from './loadModule';

async function getFederatedModule({ module, packageName, version, context }) {
  const cleanVersion = version.replace(/[-.]/g, '_');
  const cachePath = path.resolve(context.cacheDirectory, `scripts/${module}/${cleanVersion}`);
  if (!fs.existsSync(path.resolve(cachePath, 'package/dist/remoteEntry.js'))) {
    context.print.spin(`Fetching ${packageName}@${version} to cache.`);
    await fetchNpmTarball({
      packageName,
      version,
      directory: cachePath,
    });
    context.print.log(`Fetched ${packageName}@${version} to cache.`);
  }
  return loadModule({
    directory: path.resolve(cachePath, 'package/dist'),
    module: `./${module}`,
  });
}

export default getFederatedModule;
