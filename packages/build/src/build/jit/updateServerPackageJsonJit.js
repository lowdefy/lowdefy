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
import { linkWorkspaceDependencies, readFile, writeFile } from '@lowdefy/node-utils';

async function updateServerPackageJsonJit({ directories, missingPackages }) {
  const filePath = path.join(directories.server, 'package.json');
  const packageJsonContent = await readFile(filePath);
  const packageJson = JSON.parse(packageJsonContent);

  const dependencies = packageJson.dependencies ?? {};
  for (const [packageName, { version }] of missingPackages) {
    dependencies[packageName] = version;
  }

  // Sort dependencies alphabetically
  const sortedDependencies = {};
  Object.keys(dependencies)
    .sort()
    .forEach((name) => {
      sortedDependencies[name] = dependencies[name];
    });
  // A generated server installs as its own pnpm workspace, so a plugin with a
  // "workspace:" version is linked to its package in the app's workspace.
  packageJson.dependencies = await linkWorkspaceDependencies({
    dependencies: sortedDependencies,
    directory: directories.server,
  });

  const newPackageJsonContent = JSON.stringify(packageJson, null, 2).concat('\n');
  await writeFile(filePath, newPackageJsonContent);
}

export default updateServerPackageJsonJit;
