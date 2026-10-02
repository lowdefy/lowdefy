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

import { jest } from '@jest/globals';

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  readFile: jest.fn(),
  writeFileIfChanged: jest.fn(),
}));

jest.unstable_mockModule('./findWorkspacePackages.js', () => ({
  default: jest.fn(),
}));

const directory = '/repo/apps/app/.lowdefy/server';

function mockPackageJson(readFile, packageJson) {
  readFile.mockResolvedValue(JSON.stringify(packageJson));
}

test('linkWorkspacePlugins rewrites workspace plugin versions to link paths', async () => {
  const { readFile, writeFileIfChanged } = await import('@lowdefy/node-utils');
  const { default: findWorkspacePackages } = await import('./findWorkspacePackages.js');
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  mockPackageJson(readFile, {
    name: '@lowdefy/server',
    dependencies: { '@scope/plugin-a': 'workspace:*', react: '18.2.0' },
  });
  findWorkspacePackages.mockReturnValue(new Map([['@scope/plugin-a', '/repo/plugins/plugin-a']]));
  await linkWorkspacePlugins({
    directory,
    parentWorkspace: { packages: ['plugins/*'], settings: {} },
    workspaceRoot: '/repo',
  });
  expect(findWorkspacePackages.mock.calls).toEqual([
    [{ packages: ['plugins/*'], workspaceRoot: '/repo' }],
  ]);
  expect(writeFileIfChanged.mock.calls).toEqual([
    [
      '/repo/apps/app/.lowdefy/server/package.json',
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

test('linkWorkspacePlugins carries the parent pnpm version and skips the package search without workspace plugins', async () => {
  const { readFile, writeFileIfChanged } = await import('@lowdefy/node-utils');
  const { default: findWorkspacePackages } = await import('./findWorkspacePackages.js');
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  mockPackageJson(readFile, { name: '@lowdefy/server', dependencies: { react: '18.2.0' } });
  await linkWorkspacePlugins({
    directory,
    parentWorkspace: { packageManager: 'pnpm@10.29.2', packages: [], settings: {} },
    workspaceRoot: '/repo',
  });
  expect(findWorkspacePackages).not.toHaveBeenCalled();
  expect(JSON.parse(writeFileIfChanged.mock.calls[0][1])).toEqual({
    name: '@lowdefy/server',
    dependencies: { react: '18.2.0' },
    packageManager: 'pnpm@10.29.2',
  });
});

test('linkWorkspacePlugins throws when a workspace plugin is not in the parent workspace', async () => {
  const { readFile, writeFileIfChanged } = await import('@lowdefy/node-utils');
  const { default: findWorkspacePackages } = await import('./findWorkspacePackages.js');
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  mockPackageJson(readFile, {
    name: '@lowdefy/server',
    dependencies: { '@scope/missing': 'workspace:*' },
  });
  findWorkspacePackages.mockReturnValue(new Map());
  await expect(
    linkWorkspacePlugins({
      directory,
      parentWorkspace: { packages: ['plugins/*'], settings: {} },
      workspaceRoot: '/repo',
    })
  ).rejects.toThrow(
    'Plugin "@scope/missing" has version "workspace:*", but no package named "@scope/missing" was found in the pnpm workspace at /repo.'
  );
  expect(writeFileIfChanged).not.toHaveBeenCalled();
});
