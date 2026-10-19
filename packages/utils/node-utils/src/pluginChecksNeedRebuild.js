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

// The file the build writes when packages the app uses were not installed, so
// their plugin checks could not run: { packages: [{ name, schemaChecked }] }.
const PENDING_FILE = 'plugin-checks-pending.json';

function resolvesChecks(require, name) {
  try {
    require.resolve(`${name}/checks`);
    return true;
  } catch {
    return false;
  }
}

// Whether a second Lowdefy build, after the install that follows the first,
// would check anything the first could not: a pending package owns a block,
// action or operator type (its schemas are checked), or the install gave it a
// ./checks export. A package that only adds connections or requests and ships
// no rules needs no second build.
function pluginChecksNeedRebuild({ buildDirectory, serverDirectory }) {
  const pendingPath = path.join(buildDirectory, PENDING_FILE);
  if (!fs.existsSync(pendingPath)) {
    return false;
  }
  const { packages } = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
  const require = createRequire(path.join(serverDirectory, 'package.json'));
  return packages.some(({ name, schemaChecked }) => schemaChecked || resolvesChecks(require, name));
}

export default pluginChecksNeedRebuild;
