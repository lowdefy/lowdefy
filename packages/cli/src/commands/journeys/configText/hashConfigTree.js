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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Journeys, pulled traces, caches and installed packages are not config:
// editing a journey or pulling traces must not rebuild the config text set.
const SKIPPED_AT_ROOT = new Set(['tests', '.lowdefy']);
const SKIPPED_ANYWHERE = new Set(['node_modules', '.git']);

function hashDirectory({ hash, root, directory }) {
  fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !SKIPPED_ANYWHERE.has(entry.name))
    .filter((entry) => directory !== root || !SKIPPED_AT_ROOT.has(entry.name))
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .forEach((entry) => {
      const fullPath = path.join(directory, entry.name);
      const relativePath = path.relative(root, fullPath).split(path.sep).join('/');
      if (entry.isDirectory()) {
        hash.update(`d:${relativePath}\0`);
        hashDirectory({ hash, root, directory: fullPath });
        return;
      }
      if (entry.isSymbolicLink()) {
        hash.update(`l:${relativePath}\0${fs.readlinkSync(fullPath)}\0`);
        return;
      }
      if (entry.isFile()) {
        hash.update(`f:${relativePath}\0`);
        hash.update(fs.readFileSync(fullPath));
        hash.update('\0');
      }
    });
}

// A hash of the app's config files' paths and contents and the builder
// version: the key of a cached config text set.
function hashConfigTree({ configDirectory, builderVersion }) {
  const hash = crypto.createHash('sha256');
  hash.update(`builder:${builderVersion}\0`);
  hashDirectory({ hash, root: configDirectory, directory: configDirectory });
  return hash.digest('hex').slice(0, 16);
}

export default hashConfigTree;
