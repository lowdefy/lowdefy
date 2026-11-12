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

import path from 'path';
import { type } from '@lowdefy/helpers';
import { findPnpmWorkspaceRoot, readFile, spawnProcess } from '@lowdefy/node-utils';

// The names of the server dependencies linkWorkspacePlugins pointed at a
// package of the parent workspace.
function getLinkedPlugins({ dependencies, directory, workspaceRoot }) {
  return Object.keys(dependencies ?? {}).filter((name) => {
    const version = dependencies[name];
    if (!type.isString(version) || !version.startsWith('link:')) {
      return false;
    }
    const target = path.resolve(directory, version.slice('link:'.length));
    const relativePath = path.relative(workspaceRoot, target);
    return relativePath !== '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  });
}

// The plugins this process has installed, by workspace root. One command can
// install the server more than once (lowdefy build installs before and after
// its config build), and nothing in between removes what a plugin's install
// put in place, so each plugin installs once per process.
const installedPlugins = new Map();

// pnpm neither installs the dependencies of a link: target nor runs its build
// scripts, so on a fresh checkout (a CI or Vercel build) a workspace plugin the
// server links to has no node_modules and no build output. Installing those
// packages in the parent workspace, with their workspace dependencies, does
// both. The parent's lockfile is frozen: the install never rewrites it.
async function installWorkspacePlugins({ context, directory }) {
  const workspaceRoot = findPnpmWorkspaceRoot(path.dirname(directory));
  if (workspaceRoot === null) {
    return;
  }
  if (!installedPlugins.has(workspaceRoot)) {
    installedPlugins.set(workspaceRoot, new Set());
  }
  const installed = installedPlugins.get(workspaceRoot);
  const packageJson = JSON.parse(await readFile(path.join(directory, 'package.json')));
  const plugins = getLinkedPlugins({
    dependencies: packageJson.dependencies,
    directory,
    workspaceRoot,
  }).filter((name) => !installed.has(name));
  if (plugins.length === 0) {
    return;
  }
  const names = plugins.join(', ');
  context.logger.info(`Installing workspace plugins: ${names}.`);
  try {
    await spawnProcess({
      command: context.pnpmCmd,
      args: [
        'install',
        '--frozen-lockfile',
        ...plugins.flatMap((name) => ['--filter', `${name}...`]),
      ],
      stdOutLineHandler: (line) => context.logger.debug(line),
      processOptions: {
        cwd: workspaceRoot,
        shell: process.platform === 'win32',
      },
    });
  } catch (error) {
    throw new Error(
      `Installing the workspace plugins ${names} in ${workspaceRoot} failed. If the workspace lockfile is out of date, run pnpm install there.`,
      { cause: error }
    );
  }
  plugins.forEach((name) => installed.add(name));
}

export default installWorkspacePlugins;
