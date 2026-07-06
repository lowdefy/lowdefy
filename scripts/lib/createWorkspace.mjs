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

function createWorkspace({ targetDir }) {
  // Carry the repo's build-script allowlist into the isolated workspace —
  // pnpm refuses to run dependency build scripts (@swc/core, @sentry/cli,
  // better-sqlite3, esbuild) unless they are approved in the workspace file.
  // pnpm 10 reads onlyBuiltDependencies; pnpm 11 reads allowBuilds and fails
  // the install without it.
  // pnpm 11 also stopped reading pnpm.overrides from package.json, so the
  // link: overrides written by rewriteDeps/addPlugins (this runs after both)
  // are mirrored into pnpm-workspace.yaml — without them a fresh install
  // resolves @lowdefy/* plugins from the npm registry instead of the monorepo.
  const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
  const overrides = Object.entries(pkg.pnpm?.overrides ?? {}).map(
    ([name, target]) => `  '${name}': '${target}'`
  );
  fs.writeFileSync(
    path.join(targetDir, 'pnpm-workspace.yaml'),
    [
      'packages: []',
      'onlyBuiltDependencies:',
      "  - '@sentry/cli'",
      "  - '@swc/core'",
      '  - better-sqlite3',
      '  - esbuild',
      '  - sharp',
      'allowBuilds:',
      "  '@sentry/cli': true",
      "  '@swc/core': true",
      '  better-sqlite3: true',
      '  esbuild: true',
      '  sharp: true',
      ...(overrides.length > 0 ? ['overrides:', ...overrides] : []),
      '',
    ].join('\n')
  );
  if (!fs.existsSync(path.join(targetDir, '.npmrc'))) {
    fs.writeFileSync(path.join(targetDir, '.npmrc'), 'strict-peer-dependencies=false\n');
  }
}

export default createWorkspace;
