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

const fs = require('node:fs');
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const { DEV_ENTRY, getShellVariant } = require('./shellVariant.js');

const projectRoot = __dirname;

function findWorkspaceRoot(directory) {
  if (fs.existsSync(path.join(directory, 'pnpm-workspace.yaml'))) {
    return directory;
  }
  const parent = path.dirname(directory);
  return parent === directory ? null : findWorkspaceRoot(parent);
}

const config = getDefaultConfig(projectRoot);
config.resolver.unstable_enableSymlinks = true;

// A release shell (LOWDEFY_SHELL_VARIANT=release, the default for every shell but Lowdefy Dev)
// resolves the developer features' module to an empty one: the dev-tab client, connect flow and
// shake menu are not in its bundle (scripts/checkReleaseBundle.mjs checks it).
const releaseVariant = getShellVariant() === 'release';

// Lowdefy packages shared with the server import a few Node built-ins in code the client never
// runs (@lowdefy/errors reads build maps with `path`). The web client's bundler leaves them empty
// in the browser; Metro does the same here.
const SERVER_ONLY_BUILTINS = new Set(['path']);
const resolveDefault = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SERVER_ONLY_BUILTINS.has(moduleName)) {
    return { type: 'empty' };
  }
  const resolution = (resolveDefault ?? context.resolveRequest)(context, moduleName, platform);
  if (releaseVariant && resolution.type === 'sourceFile' && resolution.filePath === DEV_ENTRY) {
    return { type: 'empty' };
  }
  return resolution;
};

// In a pnpm workspace (the Lowdefy monorepo) the shell's Lowdefy packages are symlinks to their
// workspace folders: Metro watches the whole workspace and resolves from the shell's own
// node_modules before the workspace root's.
const workspaceRoot = findWorkspaceRoot(path.dirname(projectRoot));
if (workspaceRoot !== null) {
  config.watchFolders = [workspaceRoot];
  config.resolver.nodeModulesPaths = [
    path.join(projectRoot, 'node_modules'),
    path.join(workspaceRoot, 'node_modules'),
  ];
}

module.exports = config;
