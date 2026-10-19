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

// A package is installed when its package.json sits in one of the
// node_modules directories Node searches. Reading the file, rather than
// resolving `${package}/package.json`, also finds a package whose exports map
// does not list package.json.
function foundFrom(require, packageName) {
  return (require.resolve.paths(packageName) ?? []).some((directory) =>
    fs.existsSync(path.join(directory, packageName, 'package.json'))
  );
}

// Looks where importPluginModule imports from: the build package, then the
// server's node_modules.
function isPluginPackageInstalled({ context, packageName }) {
  if (foundFrom(createRequire(import.meta.url), packageName)) {
    return true;
  }
  const serverDir = context.directories?.server;
  if (!serverDir) {
    return false;
  }
  return foundFrom(createRequire(path.join(serverDir, 'package.json')), packageName);
}

export default isPluginPackageInstalled;
