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
// table names the capabilities each profile carries, and its runtime version
// function decides which binaries an update reaches. Both are plain CommonJS
// with no dependencies, so they load before the project is installed.
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
    getRuntimeVersion,
    nativeVersion: packageJson.nativeVersion,
    resolveProfile,
    version: packageJson.version,
  };
}

export default loadShellPackage;
