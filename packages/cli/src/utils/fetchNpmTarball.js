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
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import axios from 'axios';
import { Unpack } from 'tar';

import verifyIntegrity from './verifyIntegrity.js';

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
  const { dist } = packageInfo.data.versions[version];
  let tarball;

  try {
    tarball = await axios.get(dist.tarball, {
      responseType: 'arraybuffer',
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Package "${packageName}" tarball could not be found at ${dist.tarball}.`);
    }
    throw error;
  }

  if (!tarball || !tarball.data) {
    throw new Error(`Package "${packageName}" tarball could not be found at ${dist.tarball}.`);
  }
  verifyIntegrity({
    data: tarball.data,
    integrity: dist.integrity,
    name: `Package "${packageName}@${version}" tarball`,
  });
  await fs.promises.mkdir(directory, { recursive: true });
  // strict turns tar's warnings into errors, so an entry that would land
  // outside the directory (a "../" path, an absolute path or a link out)
  // fails the extraction instead of being skipped.
  await pipeline(
    Readable.from([tarball.data]),
    new Unpack({
      cwd: directory,
      strict: true,
      strip: 1, // Removes the leading package/ directory from each path
    })
  );
}

export default fetchNpmTarball;
