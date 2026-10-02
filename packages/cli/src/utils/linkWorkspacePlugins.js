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
import { readFile, writeFileIfChanged } from '@lowdefy/node-utils';

import findWorkspacePackages from './findWorkspacePackages.js';

// A server that installs as its own workspace cannot resolve "workspace:"
// versions, which name packages of the parent workspace. Each one becomes a
// link: to that package's directory, which the dev server's builds keep.
// The parent's pinned pnpm is carried over too, since pnpm and corepack read
// it from the root of the workspace they install.
async function linkWorkspacePlugins({ directory, parentWorkspace, workspaceRoot }) {
  const packageJsonPath = path.join(directory, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath));

  const workspaceDependencies = Object.keys(packageJson.dependencies).filter((name) =>
    packageJson.dependencies[name].startsWith('workspace:')
  );
  if (workspaceDependencies.length > 0) {
    const packageDirectories = findWorkspacePackages({
      packages: parentWorkspace.packages,
      workspaceRoot,
    });
    workspaceDependencies.forEach((name) => {
      const packageDirectory = packageDirectories.get(name);
      if (!packageDirectory) {
        throw new Error(
          `Plugin "${name}" has version "${packageJson.dependencies[name]}", but no package named "${name}" was found in the pnpm workspace at ${workspaceRoot}.`
        );
      }
      const relativePath = path.relative(directory, packageDirectory).split(path.sep).join('/');
      packageJson.dependencies[name] = `link:${relativePath}`;
    });
  }

  if (parentWorkspace.packageManager?.startsWith('pnpm@')) {
    packageJson.packageManager = parentWorkspace.packageManager;
  }

  await writeFileIfChanged(packageJsonPath, JSON.stringify(packageJson, null, 2).concat('\n'));
}

export default linkWorkspacePlugins;
