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

// Every endpoint artifact in build/api, as its path from the build directory with forward
// slashes. A module's endpoints sit in a folder named after the module entry.
function listEndpointFiles({ directories }) {
  const apiDirectory = path.join(directories.build, 'api');
  if (!fs.existsSync(apiDirectory)) {
    return [];
  }
  return fs
    .readdirSync(apiDirectory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) =>
      path
        .relative(directories.build, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join('/')
    )
    .sort();
}

export default listEndpointFiles;
