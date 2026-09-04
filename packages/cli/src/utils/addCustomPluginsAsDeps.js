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
import { readFile, writeFile } from '@lowdefy/node-utils';

// The file-plugin directory convention, mirrored from
// @lowdefy/build filePluginDirectories.js. The CLI runs before the build is
// installed, so it cannot import the list.
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

// A file plugin imports its dependencies by bare specifier and is copied into
// the server directory for production, where imports resolve against the
// server's node_modules and not the app's. The app's package.json is where D6
// says those dependencies are declared, so they are installed into the server
// too. A name the server already declares keeps the server's version: the
// server pins react, antd and the rest of the client runtime, and a second copy
// of those would break the bundle. devDependencies are deliberately not merged
// — the app's test and lint tooling has no place in the deployed server.
async function appDependencies({ context }) {
  const configDirectory = context.directories.config;
  if (!hasFilePlugins(configDirectory)) return {};
  const appPackageJsonPath = path.join(configDirectory, 'package.json');
  if (!fs.existsSync(appPackageJsonPath)) return {};
  const appPackageJson = JSON.parse(await readFile(appPackageJsonPath));
  return appPackageJson.dependencies ?? {};
}

async function addCustomPluginsAsDeps({ context, directory }) {
  const packageJsonPath = path.join(directory, 'package.json');
  // With `lowdefy: local` no server is installed here (getServer returns
  // early), so there is nothing to merge into.
  if (!fs.existsSync(packageJsonPath)) return;
  const packageJson = JSON.parse(await readFile(packageJsonPath));

  const dependencies = packageJson.dependencies;

  for (const [name, version] of Object.entries(await appDependencies({ context }))) {
    if (dependencies[name]) continue;
    dependencies[name] = version;
  }

  Object.values(context.plugins).forEach((plugin) => {
    dependencies[plugin.name] = plugin.version;
  });

  // Sort dependencies
  packageJson.dependencies = {};
  Object.keys(dependencies)
    .sort()
    .forEach((name) => {
      packageJson.dependencies[name] = dependencies[name];
    });

  const newPackageJsonContent = JSON.stringify(packageJson, null, 2).concat('\n');
  await writeFile(packageJsonPath, newPackageJsonContent);
}

export default addCustomPluginsAsDeps;
