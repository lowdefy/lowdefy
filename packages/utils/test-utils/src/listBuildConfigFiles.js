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

import path from 'node:path';

import { type } from '@lowdefy/helpers';

const rootFiles = ['lowdefy.yaml', 'lowdefy.yml'];

// The config files the build is known to have read: the root file and every file a _ref named,
// which refMap.json lists by its path from the config directory.
function listBuildConfigFiles({ directories, refMap }) {
  const refPaths = Object.values(refMap)
    .map((ref) => ref.path)
    .filter((refPath) => type.isString(refPath));
  return [...new Set([...rootFiles, ...refPaths])]
    .sort()
    .map((filePath) => path.resolve(directories.config, filePath));
}

export default listBuildConfigFiles;
