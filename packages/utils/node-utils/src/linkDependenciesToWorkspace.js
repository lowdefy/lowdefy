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

import findWorkspacePackages from './findWorkspacePackages.js';

// Each "workspace:" version becomes a link: to the directory of the package
// with that name among the workspace's packages, relative to directory.
function linkDependenciesToWorkspace({ dependencies, directory, packages, workspaceRoot }) {
  const workspaceDependencies = Object.keys(dependencies).filter(
    (name) => type.isString(dependencies[name]) && dependencies[name].startsWith('workspace:')
  );
  if (workspaceDependencies.length === 0) {
    return dependencies;
  }
  const packageDirectories = findWorkspacePackages({ packages, workspaceRoot });
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

export default linkDependenciesToWorkspace;
