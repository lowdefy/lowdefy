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

import linkDependenciesToWorkspace from './linkDependenciesToWorkspace.js';

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-link-dependencies-to-workspace-'));
  fs.mkdirSync(path.join(root, 'plugins/plugin-a'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'plugins/plugin-a/package.json'),
    JSON.stringify({ name: '@scope/plugin-a' })
  );
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('linkDependenciesToWorkspace links workspace versions to the packages it is given', () => {
  expect(
    linkDependenciesToWorkspace({
      dependencies: { '@scope/plugin-a': 'workspace:^1.0.0', react: '18.2.0' },
      directory: path.join(root, 'app/.lowdefy/server'),
      packages: ['plugins/*'],
      workspaceRoot: root,
    })
  ).toEqual({ '@scope/plugin-a': 'link:../../../plugins/plugin-a', react: '18.2.0' });
});

test('linkDependenciesToWorkspace does not look for packages when no version is a workspace version', () => {
  const dependencies = { react: '18.2.0' };
  expect(
    linkDependenciesToWorkspace({
      dependencies,
      directory: path.join(root, 'app/.lowdefy/server'),
      packages: ['plugins/*'],
      workspaceRoot: path.join(root, 'missing'),
    })
  ).toBe(dependencies);
});

test('linkDependenciesToWorkspace throws when the package is not among the workspace packages', () => {
  expect(() =>
    linkDependenciesToWorkspace({
      dependencies: { '@scope/plugin-a': 'workspace:*' },
      directory: path.join(root, 'app/.lowdefy/server'),
      packages: ['apps/*'],
      workspaceRoot: root,
    })
  ).toThrow(
    `Plugin "@scope/plugin-a" has version "workspace:*", but no package named "@scope/plugin-a" was found in the pnpm workspace at ${root}.`
  );
});
