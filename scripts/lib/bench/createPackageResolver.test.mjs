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
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import createPackageResolver from './createPackageResolver.mjs';

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

test('createPackageResolver names the nearest package.json with a name', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-packages-'));
  const yamlRoot = path.join(root, 'node_modules/.pnpm/yaml@2.8.1/node_modules/yaml');
  writeJson(path.join(yamlRoot, 'package.json'), { name: 'yaml' });
  writeJson(path.join(yamlRoot, 'dist/esm/package.json'), { type: 'module' });
  const buildRoot = path.join(root, 'packages/build');
  writeJson(path.join(buildRoot, 'package.json'), { name: '@lowdefy/build' });

  const packageOf = createPackageResolver();
  assert.deepEqual(packageOf(path.join(yamlRoot, 'dist/esm/compose/compose-node.js')), {
    name: 'yaml',
    root: yamlRoot,
  });
  assert.deepEqual(packageOf(path.join(buildRoot, 'dist/build/addKeys.js')), {
    name: '@lowdefy/build',
    root: buildRoot,
  });
  fs.rmSync(root, { recursive: true });
});

test('createPackageResolver returns null for a file outside any package', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-packages-'));
  // os.tmpdir() has no package.json above it.
  assert.equal(createPackageResolver()(path.join(root, 'script.js')), null);
  fs.rmSync(root, { recursive: true });
});
