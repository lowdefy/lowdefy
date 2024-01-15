/*
  Copyright 2020-2024 Lowdefy, Inc

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

async function fetchNpmTarball({ packageName, version, directory }) {
  const registryUrl = `https://registry.npmjs.org/${packageName}`;
  let packageInfo;
  try {
    packageInfo = await axios.get(registryUrl);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Package "${packageName}" could not be found at ${registryUrl}.`);
    }
    throw error;
  }

  if (!packageInfo || !packageInfo.data) {
    throw new Error(`Package "${packageName}" could not be found at ${registryUrl}.`);
  }

  if (!packageInfo.data.versions[version]) {
    throw new Error(`Invalid version. "${packageName}" does not have version "${version}".`);
  }
  let tarball;

  try {
    tarball = await axios.get(packageInfo.data.versions[version].dist.tarball, {
      responseType: 'arraybuffer',
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(
        `Package "${packageName}" tarball could not be found at ${packageInfo.data.versions[version].dist.tarball}.`
      );
    }
    throw error;
  }

  if (!tarball || !tarball.data) {
    throw new Error(
      `Package "${packageName}" tarball could not be found at ${packageInfo.data.versions[version].dist.tarball}.`
    );
  }
  await decompress(tarball.data, directory, {
    plugins: [decompressTargz()],
    strip: 1, // Removes leading /package dir from the file path
  });
}

export default fetchNpmTarball;
