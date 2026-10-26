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

import viewNpmPackage from './viewNpmPackage.js';

// The published package.json of each shell plugin, read before anything is
// written, so an unknown package or version fails first.
async function readShellPluginPackages({ context, shell }) {
  const packages = [];
  for (const plugin of shell.plugins ?? []) {
    const packageJson = await viewNpmPackage({
      context,
      name: plugin.name,
      version: plugin.version,
    });
    if (packageJson === null) {
      throw new Error(
        `Shell "${shell.id}" plugin "${plugin.name}" has no published version ${plugin.version}.`
      );
    }
    packages.push({ plugin, packageJson });
  }
  return packages;
}

export default readShellPluginPackages;
