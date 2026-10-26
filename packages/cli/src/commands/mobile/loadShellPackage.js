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
import { createRequire } from 'node:module';
import path from 'node:path';

// The copied @lowdefy/shell is authoritative at its own version: its profile
// table names the capabilities each profile carries, its runtime version
// function decides which binaries an update reaches, and its shell plugin
// functions load plugins and refuse those a profile must not take. All are
// plain CommonJS with no dependencies, so they load before the project is
// installed. `require` resolves from the project, where its shell plugins are
// installed.
function requireShellFile({ require, file, packageVersion }) {
  try {
    return require(`./${file}`);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `@lowdefy/shell@${packageVersion} has no ${file}. lowdefy mobile needs a shell with capability profiles and a native version.`,
        { cause: error }
      );
    }
    throw error;
  }
}

// Shell plugin support came after capability profiles, so a shell without it
// still serves a shell that lists no plugins.
function requireOptionalShellFile({ require, file, projectDirectory }) {
  if (!fs.existsSync(path.join(projectDirectory, file))) {
    return null;
  }
  return require(`./${file}`);
}

function loadShellPackage({ projectDirectory }) {
  const packageJsonPath = path.join(projectDirectory, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const require = createRequire(packageJsonPath);
  const { resolveProfile } = requireShellFile({
    require,
    file: 'profiles.js',
    packageVersion: packageJson.version,
  });
  const { getRuntimeVersion } = requireShellFile({
    require,
    file: 'runtimeVersion.js',
    packageVersion: packageJson.version,
  });
  return {
    checkShellPlugins: requireOptionalShellFile({
      require,
      file: 'checkShellPlugins.js',
      projectDirectory,
    }),
    getRuntimeVersion,
    nativeVersion: packageJson.nativeVersion,
    require,
    resolveProfile,
    resolveShellPlugins: requireOptionalShellFile({
      require,
      file: 'resolveShellPlugins.js',
      projectDirectory,
    }),
    version: packageJson.version,
  };
}

export default loadShellPackage;
