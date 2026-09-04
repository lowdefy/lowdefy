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

// Mirrors @lowdefy/build filePluginDirectories.js and the CLI's
// hasFilePlugins.js. These scripts run from the repo root, which cannot resolve
// a workspace package by name, so the list is mirrored rather than imported.
const FILE_PLUGIN_DIRECTORIES = [
  ['plugins', 'blocks'],
  ['plugins', 'actions'],
  ['plugins', 'operators'],
  ['plugins', 'connections'],
];

function hasFilePlugins({ configDirectory }) {
  return FILE_PLUGIN_DIRECTORIES.some((segments) =>
    fs.existsSync(path.join(configDirectory, ...segments))
  );
}

export default hasFilePlugins;
