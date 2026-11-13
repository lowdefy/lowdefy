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
import { type } from '@lowdefy/helpers';

import resolveBuildDirectory from '../resolveBuildDirectory.js';

// The collection each MongoDBCollection connection of the build reads, by connection id: what an
// expect.db on a data set fixture names. Empty when there is no build to read.
function readConnectionCollections({ context }) {
  const buildDirectory = resolveBuildDirectory({ context });
  const directory = type.isUndefined(buildDirectory)
    ? null
    : path.join(buildDirectory, 'connections');
  if (type.isNull(directory) || !fs.existsSync(directory)) {
    return {};
  }
  const collections = {};
  fs.readdirSync(directory, { recursive: true })
    .filter((fileName) => fileName.endsWith('.json'))
    .forEach((fileName) => {
      const artifact = JSON.parse(fs.readFileSync(path.join(directory, fileName), 'utf8'));
      if (artifact.type === 'MongoDBCollection' && type.isString(artifact.properties?.collection)) {
        collections[artifact.connectionId] = artifact.properties.collection;
      }
    });
  return collections;
}

export default readConnectionCollections;
