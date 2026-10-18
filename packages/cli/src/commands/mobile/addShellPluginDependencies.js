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
import { writeFileIfChanged } from '@lowdefy/node-utils';

// What each shell plugin adds to the project's dependencies: the plugin at its
// version and its native peers at their exact versions, as direct
// dependencies, so Expo autolinking finds them under pnpm, which does not
// hoist. expo itself is the shell's, and a peer the shell already has is
// checked to be the same version (checkShellPluginPeers).
function getShellPluginDependencies({ packages, shellPackageJson }) {
  const shellDependencies = shellPackageJson.dependencies ?? {};
  const added = {};
  packages.forEach(({ plugin, packageJson }) => {
    added[plugin.name] = plugin.version;
    Object.entries(packageJson.peerDependencies ?? {}).forEach(([peer, version]) => {
      if (peer !== 'expo' && shellDependencies[peer] === undefined) {
        added[peer] = version;
      }
    });
  });
  return added;
}

function sortKeys(object) {
  return Object.fromEntries(
    Object.keys(object)
      .sort()
      .map((key) => [key, object[key]])
  );
}

// Writes the project's package.json: the shell's published one with the
// plugins' dependencies added. The published one is kept as
// package.original.json the first time a plugin is added, and a shell without
// plugins gets it back; one that never had plugins is left as fetched.
async function addShellPluginDependencies({ dependencies, projectDirectory, shellPackageJson }) {
  const packageJsonPath = path.join(projectDirectory, 'package.json');
  const originalPath = path.join(projectDirectory, 'package.original.json');
  const hasOriginal = fs.existsSync(originalPath);
  if (Object.keys(dependencies).length === 0) {
    if (hasOriginal) {
      await writeFileIfChanged(packageJsonPath, await fs.promises.readFile(originalPath, 'utf8'));
    }
    return;
  }
  if (!hasOriginal) {
    await fs.promises.copyFile(packageJsonPath, originalPath);
  }
  const packageJson = {
    ...shellPackageJson,
    dependencies: sortKeys({ ...shellPackageJson.dependencies, ...dependencies }),
  };
  await writeFileIfChanged(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

export { getShellPluginDependencies };
export default addShellPluginDependencies;
