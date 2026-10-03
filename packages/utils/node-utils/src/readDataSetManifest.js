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

import path from 'path';
import { type } from '@lowdefy/helpers';

import readFile from './readFile.js';

// The manifest `lowdefy data pull` writes beside the snapshot's collection files. A missing
// manifest means the data set has not been pulled on this machine.
async function readDataSetManifest({ configDirectory, name }) {
  const filePath = path.join(configDirectory, '.lowdefy', 'data', name, 'manifest.json');
  const content = await readFile(filePath);
  if (type.isNone(content)) return null;
  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Data set "${name}" snapshot manifest ${filePath} is not valid JSON. Run: lowdefy data pull ${name}`
    );
  }
  if (!type.isObject(manifest) || !type.isString(manifest.pulledAt)) {
    throw new Error(
      `Data set "${name}" snapshot manifest ${filePath} has no "pulledAt". Run: lowdefy data pull ${name}`
    );
  }
  return {
    pulledAt: manifest.pulledAt,
    from: manifest.from,
    specHash: manifest.specHash,
    collections: manifest.collections ?? {},
  };
}

export default readDataSetManifest;
