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

export default getShellPluginDependencies;
