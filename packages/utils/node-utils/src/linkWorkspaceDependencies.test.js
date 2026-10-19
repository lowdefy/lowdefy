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

import linkWorkspaceDependencies from './linkWorkspaceDependencies.js';

let root;

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(path.join(root, filePath)), { recursive: true });
  fs.writeFileSync(path.join(root, filePath), content);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-link-workspace-dependencies-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('linkWorkspaceDependencies links workspace versions of a nested server workspace to the parent packages', async () => {
  writeFile('pnpm-workspace.yaml', 'packages:\n  - apps/*\n  - plugins/*\n');
  writeFile('plugins/plugin-a/package.json', JSON.stringify({ name: '@scope/plugin-a' }));
  writeFile('apps/app/.lowdefy/dev/pnpm-workspace.yaml', "packages:\n  - '.'\n");
  const dependencies = await linkWorkspaceDependencies({
    dependencies: { '@scope/plugin-a': 'workspace:*', react: '18.2.0' },
    directory: path.join(root, 'apps/app/.lowdefy/dev'),
  });
  expect(dependencies).toEqual({
    '@scope/plugin-a': 'link:../../../../plugins/plugin-a',
    react: '18.2.0',
  });
});

test('linkWorkspaceDependencies keeps workspace versions of a server without its own workspace', async () => {
  writeFile('pnpm-workspace.yaml', 'packages:\n  - packages/**\n');
  writeFile('packages/plugin-a/package.json', JSON.stringify({ name: 'plugin-a' }));
  fs.mkdirSync(path.join(root, 'packages/servers/server-dev'), { recursive: true });
  const dependencies = { 'plugin-a': 'workspace:*' };
  expect(
    await linkWorkspaceDependencies({
      dependencies,
      directory: path.join(root, 'packages/servers/server-dev'),
    })
  ).toBe(dependencies);
});

test('linkWorkspaceDependencies returns dependencies without workspace versions unchanged', async () => {
  const dependencies = { react: '18.2.0', 'plugin-b': 'link:../plugin-b' };
  expect(
    await linkWorkspaceDependencies({ dependencies, directory: path.join(root, 'server') })
  ).toBe(dependencies);
});

test('linkWorkspaceDependencies throws when the package is not in the parent workspace', async () => {
  writeFile('pnpm-workspace.yaml', 'packages:\n  - plugins/*\n');
  writeFile('app/.lowdefy/dev/pnpm-workspace.yaml', "packages:\n  - '.'\n");
  await expect(
    linkWorkspaceDependencies({
      dependencies: { '@scope/missing': 'workspace:*' },
      directory: path.join(root, 'app/.lowdefy/dev'),
    })
  ).rejects.toThrow(
    `Plugin "@scope/missing" has version "workspace:*", but no package named "@scope/missing" was found in the pnpm workspace at ${root}.`
  );
});

test('linkWorkspaceDependencies throws when a nested server workspace has no parent workspace', async () => {
  writeFile('app/.lowdefy/dev/pnpm-workspace.yaml', "packages:\n  - '.'\n");
  const directory = path.join(root, 'app/.lowdefy/dev');
  await expect(
    linkWorkspaceDependencies({ dependencies: { 'plugin-a': 'workspace:^1.0.0' }, directory })
  ).rejects.toThrow(
    `Plugin "plugin-a" has version "workspace:^1.0.0", but ${directory} is not inside a pnpm workspace.`
  );
});
