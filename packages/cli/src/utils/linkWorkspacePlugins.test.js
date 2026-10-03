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
  linkWorkspaceDependencies: jest.fn(),
  readFile: jest.fn(),
  writeFileIfChanged: jest.fn(),
}));

const directory = '/repo/apps/app/.lowdefy/server';

beforeEach(() => {
  jest.clearAllMocks();
});

test('linkWorkspacePlugins writes the linked plugin versions to the server package.json', async () => {
  const { linkWorkspaceDependencies, readFile, writeFileIfChanged } = await import(
    '@lowdefy/node-utils'
  );
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  readFile.mockResolvedValue(
    JSON.stringify({
      name: '@lowdefy/server',
      dependencies: { '@scope/plugin-a': 'workspace:*', react: '18.2.0' },
    })
  );
  linkWorkspaceDependencies.mockResolvedValue({
    '@scope/plugin-a': 'link:../../../../plugins/plugin-a',
    react: '18.2.0',
  });
  await linkWorkspacePlugins({ directory, parentWorkspace: { packages: ['plugins/*'] } });
  expect(linkWorkspaceDependencies.mock.calls).toEqual([
    [{ dependencies: { '@scope/plugin-a': 'workspace:*', react: '18.2.0' }, directory }],
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

test('linkWorkspacePlugins carries the parent pinned pnpm version', async () => {
  const { linkWorkspaceDependencies, readFile, writeFileIfChanged } = await import(
    '@lowdefy/node-utils'
  );
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  readFile.mockResolvedValue(
    JSON.stringify({ name: '@lowdefy/server', dependencies: { react: '18.2.0' } })
  );
  linkWorkspaceDependencies.mockImplementation(async ({ dependencies }) => dependencies);
  await linkWorkspacePlugins({
    directory,
    parentWorkspace: { packageManager: 'pnpm@10.29.2', packages: [] },
  });
  expect(JSON.parse(writeFileIfChanged.mock.calls[0][1])).toEqual({
    name: '@lowdefy/server',
    dependencies: { react: '18.2.0' },
    packageManager: 'pnpm@10.29.2',
  });
});

test('linkWorkspacePlugins does not carry a packageManager that is not pnpm', async () => {
  const { linkWorkspaceDependencies, readFile, writeFileIfChanged } = await import(
    '@lowdefy/node-utils'
  );
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  readFile.mockResolvedValue(JSON.stringify({ name: '@lowdefy/server', dependencies: {} }));
  linkWorkspaceDependencies.mockImplementation(async ({ dependencies }) => dependencies);
  await linkWorkspacePlugins({
    directory,
    parentWorkspace: { packageManager: 'yarn@4.0.0', packages: [] },
  });
  expect(JSON.parse(writeFileIfChanged.mock.calls[0][1])).toEqual({
    name: '@lowdefy/server',
    dependencies: {},
  });
});
