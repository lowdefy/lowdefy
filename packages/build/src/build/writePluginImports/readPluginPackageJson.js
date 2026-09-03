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

// A plugin package's own package.json is usually not reachable through its "exports" map, so
// resolve the "./types" subpath every plugin package exports - it is how the typesMap is built -
// and walk up from there to the package root. Resolution is rooted at the server's package.json
// for the same reason importPluginModule is: it pins the versions the app actually installed.
// Returns null when the package is not installed yet (the first build of an app that adds a
// plugin runs before installServer fetches it).
function readPluginPackageJson({ context, packageName }) {
  const serverDirectory = context.directories?.server;
  if (!serverDirectory) {
    return null;
  }
  const require = createRequire(path.join(serverDirectory, 'package.json'));
  let directory;
  try {
    directory = path.dirname(require.resolve(`${packageName}/types`));
  } catch (error) {
    return null;
  }
  while (directory !== path.dirname(directory)) {
    const filePath = path.join(directory, 'package.json');
    if (fs.existsSync(filePath)) {
      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (packageJson.name === packageName) {
        return packageJson;
      }
    }
    directory = path.dirname(directory);
  }
  return null;
}

export default readPluginPackageJson;
