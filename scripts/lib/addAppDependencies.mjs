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
// addCustomPluginsAsDeps: a file plugin imports its npm dependencies by bare
// specifier and resolves them against the server's node_modules, so the app's
// package.json dependencies are merged into the copied server. Same rules as
// the CLI: a name the server already declares keeps the server's version, and
// devDependencies never reach the server.
const FILE_PLUGIN_DIRECTORIES = [
  ['plugins', 'blocks'],
  ['plugins', 'actions'],
  ['plugins', 'operators'],
  ['plugins', 'connections'],
];

function hasFilePlugins(configDirectory) {
  return FILE_PLUGIN_DIRECTORIES.some((segments) =>
    fs.existsSync(path.join(configDirectory, ...segments))
  );
}

function addAppDependencies({ configDirectory, targetDir, logger }) {
  if (!hasFilePlugins(configDirectory)) return;
  const appPackageJsonPath = path.join(configDirectory, 'package.json');
  if (!fs.existsSync(appPackageJsonPath)) return;
  const appDependencies =
    JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf8')).dependencies ?? {};
  const names = Object.keys(appDependencies);
  if (names.length === 0) return;

  for (const jsonPath of [
    path.join(targetDir, 'package.json'),
    path.join(targetDir, 'package.original.json'),
  ]) {
    if (!fs.existsSync(jsonPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    for (const name of names) {
      if (pkg.dependencies[name]) continue;
      pkg.dependencies[name] = appDependencies[name];
    }
    fs.writeFileSync(jsonPath, JSON.stringify(pkg, null, 2) + '\n');
  }
  logger.info(
    `Added ${names.length} app package.json dependenc${
      names.length === 1 ? 'y' : 'ies'
    } for file plugins`
  );
}

export default addAppDependencies;
