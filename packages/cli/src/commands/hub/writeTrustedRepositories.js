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

import fs from 'fs';
import path from 'path';

import getHubPaths from './getHubPaths.js';

// Written to a temporary file and renamed, so a session reading the list never
// sees half of it. Only the user may read or change it: it decides which
// repositories' dev scripts agents may run.
function writeTrustedRepositories({ repositories }) {
  const { trustedPath } = getHubPaths();
  fs.mkdirSync(path.dirname(trustedPath), { recursive: true, mode: 0o700 });
  const temporaryPath = `${trustedPath}.${process.pid}.tmp`;
  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify({ repositories: [...new Set(repositories)].sort() }, null, 2)}\n`,
    { mode: 0o600 }
  );
  fs.renameSync(temporaryPath, trustedPath);
}

export default writeTrustedRepositories;
