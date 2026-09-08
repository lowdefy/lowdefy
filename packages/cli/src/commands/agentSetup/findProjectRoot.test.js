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
import os from 'os';
import path from 'path';

import findProjectRoot from './findProjectRoot.js';

let tempDir;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-find-project-root-test-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('findProjectRoot returns the config directory when it contains .git', () => {
  fs.mkdirSync(path.join(tempDir, '.git'));
  expect(findProjectRoot({ configDirectory: tempDir })).toEqual(tempDir);
});

test('findProjectRoot walks up to the nearest ancestor containing a .git directory', () => {
  fs.mkdirSync(path.join(tempDir, '.git'));
  const configDirectory = path.join(tempDir, 'apps', 'myapp');
  fs.mkdirSync(configDirectory, { recursive: true });
  expect(findProjectRoot({ configDirectory })).toEqual(tempDir);
});

test('findProjectRoot accepts .git as a file (worktrees and submodules)', () => {
  fs.writeFileSync(path.join(tempDir, '.git'), 'gitdir: /somewhere/else');
  const configDirectory = path.join(tempDir, 'apps', 'myapp');
  fs.mkdirSync(configDirectory, { recursive: true });
  expect(findProjectRoot({ configDirectory })).toEqual(tempDir);
});

test('findProjectRoot picks the nearest .git when repositories are nested', () => {
  fs.mkdirSync(path.join(tempDir, '.git'));
  const nestedRepo = path.join(tempDir, 'vendor', 'nested');
  fs.mkdirSync(path.join(nestedRepo, '.git'), { recursive: true });
  const configDirectory = path.join(nestedRepo, 'app');
  fs.mkdirSync(configDirectory, { recursive: true });
  expect(findProjectRoot({ configDirectory })).toEqual(nestedRepo);
});

test('findProjectRoot returns the config directory when no .git ancestor exists', () => {
  // os.tmpdir() ancestors on a dev machine could theoretically contain .git —
  // guard the assumption rather than asserting blindly.
  let hasGitAncestor = false;
  let directory = tempDir;
  for (;;) {
    if (fs.existsSync(path.join(directory, '.git'))) {
      hasGitAncestor = true;
      break;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      break;
    }
    directory = parent;
  }
  if (hasGitAncestor) {
    return;
  }
  const configDirectory = path.join(tempDir, 'app');
  fs.mkdirSync(configDirectory, { recursive: true });
  expect(findProjectRoot({ configDirectory })).toEqual(configDirectory);
});
