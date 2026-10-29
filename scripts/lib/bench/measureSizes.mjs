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
import path from 'node:path';

function folderBytes(directory) {
  return fs
    .readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .reduce((sum, entry) => sum + fs.statSync(path.join(entry.parentPath, entry.name)).size, 0);
}

// The sizes, in bytes, of a built server's key map, ref map and whole build/
// folder.
function measureSizes({ serverDirectory }) {
  const buildDirectory = path.join(serverDirectory, 'build');
  return {
    keyMap: fs.statSync(path.join(buildDirectory, 'keyMap.json')).size,
    refMap: fs.statSync(path.join(buildDirectory, 'refMap.json')).size,
    build: folderBytes(buildDirectory),
  };
}

export default measureSizes;
