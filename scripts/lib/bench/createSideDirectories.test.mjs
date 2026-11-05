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

import createSideDirectories from './createSideDirectories.mjs';

test('createSideDirectories links the side checkout and places the server beside it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'side-directories-'));
  const benchDirectory = path.join(root, 'bench', 'app');
  const checkoutA = path.join(root, 'checkout-a');
  const checkoutB = path.join(root, 'checkout-b');
  fs.mkdirSync(checkoutA);
  fs.mkdirSync(checkoutB);

  const first = createSideDirectories({ benchDirectory, name: 'baseline', repoRoot: checkoutA });
  assert.deepEqual(first, {
    checkoutLink: path.join(benchDirectory, 'baseline', 'lowdefy'),
    logFile: path.join(benchDirectory, 'logs', 'baseline.log'),
    serverDirectory: path.join(benchDirectory, 'baseline', 'workspace', 'server'),
  });
  assert.equal(fs.readlinkSync(first.checkoutLink), checkoutA);
  assert.equal(
    path.relative(first.serverDirectory, first.checkoutLink),
    path.join('..', '..', 'lowdefy')
  );

  createSideDirectories({ benchDirectory, name: 'baseline', repoRoot: checkoutA });
  assert.equal(fs.readlinkSync(first.checkoutLink), checkoutA);

  createSideDirectories({ benchDirectory, name: 'baseline', repoRoot: checkoutB });
  assert.equal(fs.readlinkSync(first.checkoutLink), checkoutB);
  fs.rmSync(root, { recursive: true });
});
