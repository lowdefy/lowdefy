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

// Whether an installed plugin package exports "./types". A shell-only plugin
// may be native-only, and resolving `${name}/types` throws for a package that
// does not export it, so this reads the package's own package.json, found on
// the lookup paths of `require` (a package's exports need not list it).
function hasTypesExport({ name, require }) {
  const packageJsonPath = require.resolve
    .paths(name)
    .map((directory) => path.join(directory, name, 'package.json'))
    .find((filePath) => fs.existsSync(filePath));
  if (packageJsonPath === undefined) {
    throw new Error(`Plugin "${name}" is not installed.`);
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.exports?.['./types'] !== undefined;
}

export default hasTypesExport;
