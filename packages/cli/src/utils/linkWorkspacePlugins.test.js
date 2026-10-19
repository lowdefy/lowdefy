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

import path from 'path';
import { jest } from '@jest/globals';

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  linkDependenciesToWorkspace: jest.fn(),
  readFile: jest.fn(),
  writeFileIfChanged: jest.fn(),
}));

const directory = '/repo/apps/app/.lowdefy/server';
const workspaceRoot = '/repo';

beforeEach(async () => {
  jest.clearAllMocks();
  const { linkDependenciesToWorkspace } = await import('@lowdefy/node-utils');
  linkDependenciesToWorkspace.mockImplementation(({ dependencies }) => dependencies);
});

async function linkPlugins({ parentWorkspace, serverPackageJson }) {
  const { readFile, writeFileIfChanged } = await import('@lowdefy/node-utils');
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  readFile.mockResolvedValue(JSON.stringify(serverPackageJson));
  await linkWorkspacePlugins({ directory, parentWorkspace, workspaceRoot });
  return JSON.parse(writeFileIfChanged.mock.calls[0][1]);
}

test('linkWorkspacePlugins links plugins to the parent packages it was given', async () => {
  const { linkDependenciesToWorkspace, readFile, writeFileIfChanged } = await import(
    '@lowdefy/node-utils'
  );
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  readFile.mockResolvedValue(
    JSON.stringify({
      name: '@lowdefy/server',
      dependencies: { '@scope/plugin-a': 'workspace:*', react: '18.2.0' },
    })
  );
  linkDependenciesToWorkspace.mockReturnValue({
    '@scope/plugin-a': 'link:../../../../plugins/plugin-a',
    react: '18.2.0',
  });
  await linkWorkspacePlugins({
    directory,
    parentWorkspace: { packages: ['plugins/*'] },
    workspaceRoot,
  });
  expect(linkDependenciesToWorkspace.mock.calls).toEqual([
    [
      {
        dependencies: { '@scope/plugin-a': 'workspace:*', react: '18.2.0' },
        directory,
        packages: ['plugins/*'],
        workspaceRoot,
      },
    ],
  ]);
  expect(writeFileIfChanged.mock.calls).toEqual([
    [
      path.join(directory, 'package.json'),
      `{
  "name": "@lowdefy/server",
  "dependencies": {
    "@scope/plugin-a": "link:../../../../plugins/plugin-a",
    "react": "18.2.0"
  }
}
`,
    ],
  ]);
});

test('linkWorkspacePlugins carries the parent pinned pnpm version', async () => {
  expect(
    await linkPlugins({
      parentWorkspace: { packageManager: 'pnpm@10.29.2', packages: [] },
      serverPackageJson: { name: '@lowdefy/server', dependencies: { react: '18.2.0' } },
    })
  ).toEqual({
    name: '@lowdefy/server',
    dependencies: { react: '18.2.0' },
    packageManager: 'pnpm@10.29.2',
  });
});

test('linkWorkspacePlugins does not carry a packageManager that is not pnpm', async () => {
  expect(
    await linkPlugins({
      parentWorkspace: { packageManager: 'yarn@4.0.0', packages: [] },
      serverPackageJson: { name: '@lowdefy/server', dependencies: {} },
    })
  ).toEqual({ name: '@lowdefy/server', dependencies: {} });
});

test('linkWorkspacePlugins carries the parent devEngines.packageManager pnpm pin', async () => {
  const packageManager = { name: 'pnpm', version: '^11.0.0', onFail: 'download' };
  expect(
    await linkPlugins({
      parentWorkspace: { devEnginesPackageManager: packageManager, packages: [] },
      serverPackageJson: { name: '@lowdefy/server', dependencies: {} },
    })
  ).toEqual({ name: '@lowdefy/server', dependencies: {}, devEngines: { packageManager } });
});

test('linkWorkspacePlugins carries a devEngines.packageManager list that names pnpm', async () => {
  const packageManager = [
    { name: 'npm', version: '^10.0.0' },
    { name: 'pnpm', version: '^10.29.0' },
  ];
  expect(
    await linkPlugins({
      parentWorkspace: { devEnginesPackageManager: packageManager, packages: [] },
      serverPackageJson: { name: '@lowdefy/server', dependencies: {} },
    })
  ).toEqual({ name: '@lowdefy/server', dependencies: {}, devEngines: { packageManager } });
});

test('linkWorkspacePlugins does not carry a devEngines.packageManager that does not name pnpm', async () => {
  expect(
    await linkPlugins({
      parentWorkspace: {
        devEnginesPackageManager: { name: 'yarn', version: '^4.0.0' },
        packages: [],
      },
      serverPackageJson: { name: '@lowdefy/server', dependencies: {} },
    })
  ).toEqual({ name: '@lowdefy/server', dependencies: {} });
});

test('linkWorkspacePlugins removes pins the parent no longer sets from a kept server package.json', async () => {
  expect(
    await linkPlugins({
      parentWorkspace: { packages: [] },
      serverPackageJson: {
        name: '@lowdefy/server',
        dependencies: {},
        devEngines: { packageManager: { name: 'pnpm', version: '^10.0.0' } },
        packageManager: 'pnpm@10.29.2',
      },
    })
  ).toEqual({ name: '@lowdefy/server', dependencies: {} });
});

test('linkWorkspacePlugins replaces a stale pin with the one the parent now sets', async () => {
  expect(
    await linkPlugins({
      parentWorkspace: { packageManager: 'pnpm@11.15.0', packages: [] },
      serverPackageJson: {
        name: '@lowdefy/server',
        dependencies: {},
        packageManager: 'pnpm@10.29.2',
      },
    })
  ).toEqual({ name: '@lowdefy/server', dependencies: {}, packageManager: 'pnpm@11.15.0' });
});
