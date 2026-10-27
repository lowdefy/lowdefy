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

import semver from 'semver';

const EXACT_VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

// A shell plugin's native modules and expo are its peerDependencies: the
// modules at exact versions, so one plugin name and version is always the
// same native code, and all of them optional, so the web server's install
// leaves them out. Fails, naming shell, plugin and peer, before anything is
// written.
function checkShellPluginPeers({ shell, packages, shellPackageJson }) {
  const shellDependencies = shellPackageJson.dependencies ?? {};
  const expoVersion = shellDependencies.expo;
  packages.forEach(({ plugin, packageJson }) => {
    const where = `Shell "${shell.id}" plugin "${plugin.name}@${plugin.version}"`;
    const peers = packageJson.peerDependencies ?? {};
    const meta = packageJson.peerDependenciesMeta ?? {};
    if (peers.expo === undefined) {
      throw new Error(
        `${where} declares no "expo" peer range. A shell plugin names the Expo versions it supports as an optional peer dependency.`
      );
    }
    if (!semver.satisfies(expoVersion, peers.expo)) {
      throw new Error(
        `${where} supports expo "${peers.expo}", and @lowdefy/shell@${shellPackageJson.version} uses expo ${expoVersion}. Use a version of the plugin built for this Expo version.`
      );
    }
    Object.entries(peers).forEach(([peer, version]) => {
      if (meta[peer]?.optional !== true) {
        throw new Error(
          `${where} peer "${peer}" is not marked optional in peerDependenciesMeta. Shell plugin peers are optional, so the web server's install leaves the native code out.`
        );
      }
      if (peer === 'expo') {
        return;
      }
      if (!EXACT_VERSION.test(version)) {
        throw new Error(
          `${where} peer "${peer}" should be an exact version, like 1.2.3. Received "${version}".`
        );
      }
      const shellVersion = shellDependencies[peer];
      if (shellVersion !== undefined && shellVersion !== version) {
        throw new Error(
          `${where} peer "${peer}" is ${version}, and @lowdefy/shell@${shellPackageJson.version} uses ${shellVersion}. Use a version of the plugin built for this shell.`
        );
      }
    });
  });
}

export default checkShellPluginPeers;
