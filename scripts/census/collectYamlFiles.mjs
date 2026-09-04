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

// Directories that hold generated or installed files rather than the app's own
// config. Counting them would make the census a measure of the toolchain.
const skipDirectories = new Set([
  'build',
  'coverage',
  'dist',
  'node_modules',
  'snapshots',
  'test-results',
]);

function isYaml(name) {
  return name.endsWith('.yaml') || name.endsWith('.yml');
}

// Every YAML file of a config directory, as paths relative to it, sorted so two
// runs of the census on the same tree report the same order.
function collectYamlFiles({ directory }) {
  const files = [];
  function walk(relative) {
    const entries = fs.readdirSync(path.join(directory, relative), { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = relative === '' ? entry.name : path.join(relative, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || skipDirectories.has(entry.name)) {
          continue;
        }
        walk(entryPath);
        continue;
      }
      if (entry.isFile() && isYaml(entry.name)) {
        files.push(entryPath);
      }
    }
  }
  walk('');
  return files.sort();
}

export default collectYamlFiles;
