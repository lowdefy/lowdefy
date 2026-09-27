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

import selectLocalPluginPackages from './selectLocalPluginPackages.mjs';

let root;
let directories;

function addLinkedPackage({ name, base }) {
  const dir = path.join(root, 'plugins', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.dirname(path.join(base, 'node_modules', name)), { recursive: true });
  fs.symlinkSync(dir, path.join(base, 'node_modules', name), 'dir');
  return fs.realpathSync(dir);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-select-test-'));
  directories = {
    config: path.join(root, 'app'),
    server: path.join(root, 'app', '.lowdefy', 'dev'),
  };
  fs.mkdirSync(path.join(directories.server, 'node_modules'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('selectLocalPluginPackages selects every linked plugin, block-only plugins included', () => {
  const ui = addLinkedPackage({ name: '@app/ui-plugin', base: directories.server });
  const db = addLinkedPackage({ name: '@app/db-plugin', base: directories.config });

  expect(
    selectLocalPluginPackages({
      directories,
      packageNames: ['@app/ui-plugin', '@app/db-plugin', '@app/ui-plugin'],
    })
  ).toEqual([
    { package: '@app/ui-plugin', dir: ui },
    { package: '@app/db-plugin', dir: db },
  ]);
});

test('selectLocalPluginPackages skips installed and missing packages', () => {
  fs.mkdirSync(path.join(directories.server, 'node_modules', '@lowdefy', 'connection-mongodb'), {
    recursive: true,
  });

  expect(
    selectLocalPluginPackages({
      directories,
      packageNames: ['@lowdefy/connection-mongodb', '@app/not-installed'],
    })
  ).toEqual([]);
});
