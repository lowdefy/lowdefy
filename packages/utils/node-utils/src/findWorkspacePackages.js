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

// Mirrors how pnpm reads the "packages" globs of pnpm-workspace.yaml: the
// workspace root is always a project, "!" patterns exclude, and node_modules
// is never searched. Returns a map of package name to absolute directory.
function findWorkspacePackages({ packages, workspaceRoot }) {
  const include = ['.'];
  const exclude = ['**/node_modules/**'];
  packages.forEach((pattern) => {
    if (pattern.startsWith('!')) {
      exclude.push(`${pattern.slice(1)}/package.json`);
    } else {
      include.push(pattern);
    }
  });
  const packageJsonPaths = fs.globSync(
    include.map((pattern) => path.posix.join(pattern, 'package.json')),
    { cwd: workspaceRoot, exclude }
  );
  const packageDirectories = new Map();
  packageJsonPaths.forEach((packageJsonPath) => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(workspaceRoot, packageJsonPath), 'utf8')
    );
    if (packageJson.name) {
      packageDirectories.set(
        packageJson.name,
        path.join(workspaceRoot, path.dirname(packageJsonPath))
      );
    }
  });
  return packageDirectories;
}

export default findWorkspacePackages;
