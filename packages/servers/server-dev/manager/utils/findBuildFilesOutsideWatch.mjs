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

function isInside({ directory, filePath }) {
  return filePath === directory || filePath.startsWith(`${directory}${path.sep}`);
}

// refMap.json holds the config build's refs; a jitMaps/ file holds the refs a
// JIT page build added, under refMap. A jitMaps file can be pruned before its
// change is handled, and then has nothing to add.
function readRefMap(mapsFile) {
  if (path.basename(mapsFile) === 'refMap.json') {
    return JSON.parse(fs.readFileSync(mapsFile, 'utf8'));
  }
  try {
    return JSON.parse(fs.readFileSync(mapsFile, 'utf8')).refMap ?? {};
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

// Every file a build reads is recorded in a ref map: app refs by their path
// relative to the config directory, module refs by absolute path. Returns the
// files the given maps files record that lie outside every watched directory,
// such as a file a local module refs with ../ from beside the module.
function findBuildFilesOutsideWatch({ mapsFiles, configDirectory, watchRoots }) {
  const files = new Set();
  for (const mapsFile of mapsFiles) {
    for (const entry of Object.values(readRefMap(mapsFile))) {
      if (!type.isString(entry.path)) continue;
      const filePath = path.resolve(configDirectory, entry.path);
      if (watchRoots.some((directory) => isInside({ directory, filePath }))) continue;
      files.add(filePath);
    }
  }
  return [...files];
}

export default findBuildFilesOutsideWatch;
