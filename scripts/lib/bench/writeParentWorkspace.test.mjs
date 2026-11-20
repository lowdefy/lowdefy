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

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { REPO_ROOT } from '../parseArgs.mjs';
import writeParentWorkspace from './writeParentWorkspace.mjs';

const YAML = createRequire(path.join(REPO_ROOT, 'packages/cli/package.json'))('yaml');

test('writeParentWorkspace writes the server settings relative to its parent folder', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'parent-workspace-'));
  const serverDirectory = path.join(root, '_server', 'bench', 'app', 'current');
  fs.mkdirSync(serverDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(serverDirectory, 'pnpm-workspace.yaml'),
    YAML.stringify({
      packages: [],
      autoInstallPeers: false,
      allowBuilds: { esbuild: true },
      overrides: {
        '@lowdefy/api': 'link:../../../../packages/api',
        '@acme/plugin': 'link:../../../../../outside/plugins/acme',
        lodash: '4.17.21',
      },
    })
  );
  writeParentWorkspace({ serverDirectory });
  const parent = YAML.parse(
    fs.readFileSync(path.join(root, '_server', 'bench', 'app', 'pnpm-workspace.yaml'), 'utf8')
  );
  assert.deepEqual(parent, {
    packages: ['../../../../outside/plugins/acme', '../../../packages/api'],
    autoInstallPeers: false,
    allowBuilds: { esbuild: true },
    overrides: {
      '@lowdefy/api': 'link:../../../packages/api',
      '@acme/plugin': 'link:../../../../outside/plugins/acme',
      lodash: '4.17.21',
    },
  });
  fs.rmSync(root, { recursive: true });
});
