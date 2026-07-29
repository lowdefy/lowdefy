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
import { writeFile } from '@lowdefy/node-utils';

// pnpm no longer reads the "pnpm" field in package.json, and pnpm 11 fails
// installs with ERR_PNPM_IGNORED_BUILDS unless dependency build scripts are
// allowed in pnpm-workspace.yaml. The key differs by version:
// - packages is required by pnpm 9 and 10.0, and stops pnpm from treating the
//   server as part of a parent workspace.
// - onlyBuiltDependencies is read by early pnpm 10 versions.
// - allowBuilds is read by pnpm >=10.29 and pnpm 11.
const pnpmWorkspaceYaml = `packages:
  - '.'
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
allowBuilds:
  better-sqlite3: true
  sharp: true
`;

async function ensurePnpmWorkspaceYaml({ context, directory }) {
  // Local mode runs against the monorepo packages; writing a nested
  // pnpm-workspace.yaml there would corrupt the monorepo workspace.
  if (context.lowdefyVersion === 'local') {
    return;
  }
  const filePath = path.join(directory, 'pnpm-workspace.yaml');
  // Keep existing files so users can allow builds for their own plugin deps.
  if (fs.existsSync(filePath)) {
    return;
  }
  await writeFile(filePath, pnpmWorkspaceYaml);
}

export default ensurePnpmWorkspaceYaml;
