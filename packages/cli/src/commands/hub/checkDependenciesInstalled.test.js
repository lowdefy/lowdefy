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

import checkDependenciesInstalled from './checkDependenciesInstalled.js';

let root;

function writeJson(relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

beforeEach(() => {
  root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-deps-')));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('checkDependenciesInstalled names the install command and workspace root when lowdefy is not installed', () => {
  fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), '');
  writeJson('apps/main/package.json', { devDependencies: { lowdefy: '7.1.0' } });
  const configDirectory = path.join(root, 'apps', 'main');

  expect(() => checkDependenciesInstalled({ configDirectory })).toThrow(
    `The dependencies of ${configDirectory} are not installed: its package.json lists lowdefy, but no node_modules has it. Run \`pnpm install\` in ${root}, then start the dev server again.`
  );
});

test('checkDependenciesInstalled passes when lowdefy is hoisted to the workspace root', () => {
  writeJson('apps/main/package.json', { dependencies: { lowdefy: '7.1.0' } });
  writeJson('node_modules/lowdefy/package.json', { name: 'lowdefy', version: '7.1.0' });

  expect(() =>
    checkDependenciesInstalled({ configDirectory: path.join(root, 'apps', 'main') })
  ).not.toThrow();
});

test('checkDependenciesInstalled leaves an app that does not list lowdefy to its dev script', () => {
  writeJson('package.json', { scripts: { dev: 'npx lowdefy@7 dev' } });

  expect(() => checkDependenciesInstalled({ configDirectory: root })).not.toThrow();
});
