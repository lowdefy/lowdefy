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

import updateServerPackageJson from './updateServerPackageJson.js';

let root;

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(path.join(root, filePath)), { recursive: true });
  fs.writeFileSync(path.join(root, filePath), content);
}

function readServerPackageJson(serverDirectory) {
  return JSON.parse(fs.readFileSync(path.join(serverDirectory, 'package.json'), 'utf8'));
}

function createComponents({ operators }) {
  return {
    types: {
      actions: {},
      agents: {},
      auth: { adapters: {}, providers: {}, strategies: {} },
      blocks: { Box: { package: '@lowdefy/blocks-basic', version: '1.0.0' } },
      connections: {},
      notifications: {},
      requests: {},
      websockets: {},
      operators: { client: operators, server: operators },
    },
  };
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-update-server-package-json-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('updateServerPackageJson links a workspace plugin of a server that installs as its own workspace', async () => {
  writeFile('pnpm-workspace.yaml', 'packages:\n  - apps/*\n  - plugins/*\n');
  writeFile('plugins/plugin-hello/package.json', JSON.stringify({ name: 'plugin-hello' }));
  writeFile('apps/app/.lowdefy/dev/pnpm-workspace.yaml', "packages:\n  - '.'\n");
  writeFile(
    'apps/app/.lowdefy/dev/package.json',
    JSON.stringify({ name: '@lowdefy/server-dev', dependencies: { react: '18.2.0' } })
  );
  const serverDirectory = path.join(root, 'apps/app/.lowdefy/dev');
  await updateServerPackageJson({
    components: createComponents({
      operators: { _hello: { package: 'plugin-hello', version: 'workspace:*' } },
    }),
    context: { directories: { server: serverDirectory }, typesMap: {} },
  });
  expect(readServerPackageJson(serverDirectory).dependencies).toEqual({
    '@lowdefy/blocks-basic': '1.0.0',
    'plugin-hello': 'link:../../../../plugins/plugin-hello',
    react: '18.2.0',
  });
});

test('updateServerPackageJson keeps a plugin already linked to its package', async () => {
  writeFile('pnpm-workspace.yaml', 'packages:\n  - apps/*\n');
  writeFile('apps/app/.lowdefy/server/pnpm-workspace.yaml', "packages:\n  - '.'\n");
  writeFile(
    'apps/app/.lowdefy/server/package.json',
    JSON.stringify({
      name: '@lowdefy/server',
      dependencies: { 'plugin-hello': 'link:../../../../vendor/plugin-hello' },
    })
  );
  const serverDirectory = path.join(root, 'apps/app/.lowdefy/server');
  await updateServerPackageJson({
    components: createComponents({
      operators: { _hello: { package: 'plugin-hello', version: 'workspace:*' } },
    }),
    context: { directories: { server: serverDirectory }, typesMap: {} },
  });
  expect(readServerPackageJson(serverDirectory).dependencies).toEqual({
    '@lowdefy/blocks-basic': '1.0.0',
    'plugin-hello': 'link:../../../../vendor/plugin-hello',
  });
});

test('updateServerPackageJson keeps workspace versions for a server that is a member of the workspace', async () => {
  writeFile('pnpm-workspace.yaml', 'packages:\n  - packages/**\n');
  writeFile('packages/plugin-hello/package.json', JSON.stringify({ name: 'plugin-hello' }));
  writeFile(
    'packages/servers/server-dev/package.json',
    JSON.stringify({ name: '@lowdefy/server-dev', dependencies: {} })
  );
  const serverDirectory = path.join(root, 'packages/servers/server-dev');
  await updateServerPackageJson({
    components: createComponents({
      operators: { _hello: { package: 'plugin-hello', version: 'workspace:*' } },
    }),
    context: { directories: { server: serverDirectory }, typesMap: {} },
  });
  expect(readServerPackageJson(serverDirectory).dependencies).toEqual({
    '@lowdefy/blocks-basic': '1.0.0',
    'plugin-hello': 'workspace:*',
  });
});
