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

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Mirrors what `changeset publish` targets: every non-private workspace package, minus the
// `ignore` list in .changeset/config.json.
function getPublishablePackages() {
  const { ignore = [] } = readJson('.changeset/config.json');
  const ignored = new Set(ignore);

  const workspaces = JSON.parse(
    execFileSync('pnpm', ['ls', '-r', '--depth', '-1', '--json'], { encoding: 'utf8' })
  );

  return workspaces
    .map((workspace) => readJson(join(workspace.path, 'package.json')))
    .filter((pkg) => pkg.name && pkg.version && pkg.private !== true && !ignored.has(pkg.name))
    .map((pkg) => ({ name: pkg.name, version: pkg.version }));
}

export default getPublishablePackages;
