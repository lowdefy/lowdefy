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

import axios from 'axios';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';

async function loadBuildScriptToCache(version, cachePath) {
  const packageInfo = await axios.get('https://registry.npmjs.org/@lowdefy/build');
  if (!packageInfo || !packageInfo.data) {
    // TODO: What should this error message be?
    throw new Error('Build script could not be found.');
  }
  if (!packageInfo.data.versions[version]) {
    throw new Error(`Invalid Lowdefy version. Version "${version}" does not exist.`);
  }
  const tarball = await axios.get(packageInfo.data.versions[version].dist.tarball, {
    responseType: 'arraybuffer',
  });
  if (!tarball || !tarball.data) {
    // TODO: What should this error message be?
    throw new Error('Build script could not be fetched.');
  }
  await decompress(tarball.data, cachePath, {
    plugins: [decompressTargz()],
  });
}

export default loadBuildScriptToCache;
