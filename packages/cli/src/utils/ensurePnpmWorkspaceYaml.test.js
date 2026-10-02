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

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn(),
  },
}));

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  writeFile: jest.fn(),
  writeFileIfChanged: jest.fn(),
}));

jest.unstable_mockModule('./readParentWorkspace.js', () => ({
  default: jest.fn(),
}));

jest.unstable_mockModule('./linkWorkspacePlugins.js', () => ({
  default: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('ensurePnpmWorkspaceYaml writes pnpm-workspace.yaml when it does not exist', async () => {
  const { default: fs } = await import('fs');
  const { writeFile } = await import('@lowdefy/node-utils');
  const { default: ensurePnpmWorkspaceYaml } = await import('./ensurePnpmWorkspaceYaml.js');
  fs.existsSync.mockReturnValue(false);
  const context = { lowdefyVersion: '5.5.1' };
  await ensurePnpmWorkspaceYaml({ context, directory: '/dir' });
  expect(writeFile.mock.calls).toEqual([
    [
      '/dir/pnpm-workspace.yaml',
      `packages:
  - '.'
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
allowBuilds:
  better-sqlite3: true
  sharp: true
`,
    ],
  ]);
});

test('ensurePnpmWorkspaceYaml does not overwrite an existing pnpm-workspace.yaml', async () => {
  const { default: fs } = await import('fs');
  const { writeFile } = await import('@lowdefy/node-utils');
  const { default: ensurePnpmWorkspaceYaml } = await import('./ensurePnpmWorkspaceYaml.js');
  fs.existsSync.mockReturnValue(true);
  const context = { lowdefyVersion: '5.5.1' };
  await ensurePnpmWorkspaceYaml({ context, directory: '/dir' });
  expect(fs.existsSync.mock.calls).toEqual([['/dir/pnpm-workspace.yaml']]);
  expect(writeFile).not.toHaveBeenCalled();
});

test('ensurePnpmWorkspaceYaml writes a nested workspace from the parent settings inside a pnpm workspace', async () => {
  const { default: fs } = await import('fs');
  const { writeFile, writeFileIfChanged } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  const { default: linkWorkspacePlugins } = await import('./linkWorkspacePlugins.js');
  const { default: ensurePnpmWorkspaceYaml } = await import('./ensurePnpmWorkspaceYaml.js');
  fs.existsSync.mockImplementation((filePath) => filePath === '/repo/pnpm-workspace.yaml');
  const parentWorkspace = {
    packageManager: 'pnpm@10.29.2',
    packages: ['plugins/*'],
    settings: {
      overrides: { a: '1.0.0' },
      patchedDependencies: { 'b@1.0.0': 'patches/b@1.0.0.patch' },
    },
  };
  readParentWorkspace.mockResolvedValue(parentWorkspace);
  const context = { lowdefyVersion: '5.5.1', logger: { debug: jest.fn() } };
  await ensurePnpmWorkspaceYaml({ context, directory: '/repo/app/.lowdefy/dev' });
  expect(writeFile).not.toHaveBeenCalled();
  expect(readParentWorkspace.mock.calls).toEqual([[{ workspaceRoot: '/repo' }]]);
  expect(writeFileIfChanged.mock.calls).toEqual([
    [
      '/repo/app/.lowdefy/dev/pnpm-workspace.yaml',
      `packages:
  - .
overrides:
  a: 1.0.0
patchedDependencies:
  b@1.0.0: ../../../patches/b@1.0.0.patch
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
allowBuilds:
  better-sqlite3: true
  sharp: true
allowUnusedPatches: true
`,
    ],
  ]);
  expect(linkWorkspacePlugins.mock.calls).toEqual([
    [{ directory: '/repo/app/.lowdefy/dev', parentWorkspace, workspaceRoot: '/repo' }],
  ]);
});

test('ensurePnpmWorkspaceYaml rewrites an existing pnpm-workspace.yaml inside a pnpm workspace', async () => {
  const { default: fs } = await import('fs');
  const { writeFileIfChanged } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  const { default: ensurePnpmWorkspaceYaml } = await import('./ensurePnpmWorkspaceYaml.js');
  fs.existsSync.mockImplementation(
    (filePath) =>
      filePath === '/repo/pnpm-workspace.yaml' ||
      filePath === '/repo/app/.lowdefy/dev/pnpm-workspace.yaml'
  );
  readParentWorkspace.mockResolvedValue({ packages: [], settings: {} });
  const context = { lowdefyVersion: '5.5.1', logger: { debug: jest.fn() } };
  await ensurePnpmWorkspaceYaml({ context, directory: '/repo/app/.lowdefy/dev' });
  expect(writeFileIfChanged).toHaveBeenCalledTimes(1);
});

test('ensurePnpmWorkspaceYaml skips writing when running local version', async () => {
  const { default: fs } = await import('fs');
  const { writeFile } = await import('@lowdefy/node-utils');
  const { default: ensurePnpmWorkspaceYaml } = await import('./ensurePnpmWorkspaceYaml.js');
  const context = { lowdefyVersion: 'local' };
  await ensurePnpmWorkspaceYaml({ context, directory: '/dir' });
  expect(fs.existsSync).not.toHaveBeenCalled();
  expect(writeFile).not.toHaveBeenCalled();
});
