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

async function fetchNpmTarball({ name, version, directory }) {
  const registryUrl = `https://registry.npmjs.org/${name}`;
  const packageInfo = await axios.get(registryUrl);
  if (!packageInfo || !packageInfo.data) {
    // TODO: Check if user has internet connection.
    throw new Error(
      `Package "${name}" could not be found at ${registryUrl}. Check internet connection.`
    );
  }
  if (!packageInfo.data.versions[version]) {
    throw new Error(`Invalid version. "${name}" does not have version "${version}".`);
  }
  const tarball = await axios.get(packageInfo.data.versions[version].dist.tarball, {
    responseType: 'arraybuffer',
  });
  if (!tarball || !tarball.data) {
    /// TODO: Check if user has internet connection.
    throw new Error(
      `Tarball could not be fetched from "${packageInfo.data.versions[version].dist.tarball}". Check internet connection.`
    );
  }
  await decompress(tarball.data, directory, {
    plugins: [decompressTargz()],
  });
}

export default fetchNpmTarball;
