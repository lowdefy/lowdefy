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
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import findPnpmWorkspaceRoot from './findPnpmWorkspaceRoot.js';
import findWorkspacePackages from './findWorkspacePackages.js';
import readFile from './readFile.js';

async function readWorkspacePackages({ workspaceRoot }) {
  const filePath = path.join(workspaceRoot, 'pnpm-workspace.yaml');
  const document = YAML.parseDocument((await readFile(filePath)) ?? '');
  if (document.errors.length > 0) {
    throw new Error(`Could not parse ${filePath}: ${document.errors[0].message}`);
  }
  return document.toJS()?.packages ?? [];
}

// A generated server with its own pnpm-workspace.yaml installs as its own
// workspace, so it cannot resolve "workspace:" versions, which name packages
// of the parent workspace. Each one becomes a link: to that package's
// directory. A server without one (the Lowdefy monorepo's own servers) is a
// member of the enclosing workspace and resolves them itself.
async function linkWorkspaceDependencies({ dependencies, directory }) {
  const workspaceDependencies = Object.keys(dependencies).filter(
    (name) => type.isString(dependencies[name]) && dependencies[name].startsWith('workspace:')
  );
  if (workspaceDependencies.length === 0) {
    return dependencies;
  }
  if (!fs.existsSync(path.join(directory, 'pnpm-workspace.yaml'))) {
    return dependencies;
  }
  const workspaceRoot = findPnpmWorkspaceRoot(path.dirname(directory));
  if (workspaceRoot === null) {
    const name = workspaceDependencies[0];
    throw new Error(
      `Plugin "${name}" has version "${dependencies[name]}", but ${directory} is not inside a pnpm workspace.`
    );
  }
  const packageDirectories = findWorkspacePackages({
    packages: await readWorkspacePackages({ workspaceRoot }),
    workspaceRoot,
  });
  const linked = { ...dependencies };
  workspaceDependencies.forEach((name) => {
    const packageDirectory = packageDirectories.get(name);
    if (!packageDirectory) {
      throw new Error(
        `Plugin "${name}" has version "${dependencies[name]}", but no package named "${name}" was found in the pnpm workspace at ${workspaceRoot}.`
      );
    }
    const relativePath = path.relative(directory, packageDirectory).split(path.sep).join('/');
    linked[name] = `link:${relativePath}`;
  });
  return linked;
}

export default linkWorkspaceDependencies;
