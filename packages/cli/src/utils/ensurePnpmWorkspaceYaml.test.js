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

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn(),
  },
}));

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  findPnpmWorkspaceRoot: jest.fn(),
  findWorkspacePackages: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  writeFileIfChanged: jest.fn(),
}));

jest.unstable_mockModule('./readParentWorkspace.js', () => ({
  default: jest.fn(),
}));

jest.unstable_mockModule('./linkWorkspacePlugins.js', () => ({
  default: jest.fn(),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  const { default: fs } = await import('fs');
  const { findPnpmWorkspaceRoot, readFile } = await import('@lowdefy/node-utils');
  readFile.mockResolvedValue(null);
  // Walks up like the real function, over the mocked fs.
  findPnpmWorkspaceRoot.mockImplementation((startDir) => {
    let dir = startDir;
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
        return dir;
      }
      dir = path.dirname(dir);
    }
    return null;
  });
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
ignoredBuiltDependencies:
  - '@sentry/cli'
allowBuilds:
  better-sqlite3: true
  sharp: true
  '@sentry/cli': false
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
    npmrc: null,
    npmrcPath: '/repo/.npmrc',
    packageManager: 'pnpm@10.29.2',
    packages: ['plugins/*'],
    rootDependencies: {},
    settings: {
      overrides: { a: '1.0.0' },
      patchedDependencies: { 'b@1.0.0': 'patches/b@1.0.0.patch' },
    },
  };
  readParentWorkspace.mockResolvedValue(parentWorkspace);
  const context = { lowdefyVersion: '5.5.1', logger: { debug: jest.fn() }, pnpmCmd: 'pnpm' };
  await ensurePnpmWorkspaceYaml({ context, directory: '/repo/app/.lowdefy/dev' });
  expect(writeFile).not.toHaveBeenCalled();
  expect(readParentWorkspace.mock.calls).toEqual([
    [{ directory: '/repo/app/.lowdefy/dev', pnpmCmd: 'pnpm', workspaceRoot: '/repo' }],
  ]);
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
ignoredBuiltDependencies:
  - "@sentry/cli"
allowBuilds:
  better-sqlite3: true
  sharp: true
  "@sentry/cli": false
allowUnusedPatches: true
`,
    ],
  ]);
  expect(writeFileIfChanged).toHaveBeenCalledTimes(1);
  expect(linkWorkspacePlugins.mock.calls).toEqual([
    [{ directory: '/repo/app/.lowdefy/dev', parentWorkspace }],
  ]);
});

test('ensurePnpmWorkspaceYaml copies the parent .npmrc and warns about credentials it leaves out', async () => {
  const { default: fs } = await import('fs');
  const { readFile, writeFileIfChanged } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  const { default: ensurePnpmWorkspaceYaml } = await import('./ensurePnpmWorkspaceYaml.js');
  fs.existsSync.mockImplementation((filePath) => filePath === '/repo/pnpm-workspace.yaml');
  readFile.mockResolvedValue('strict-peer-dependencies=false\n');
  readParentWorkspace.mockResolvedValue({
    npmrc: '@scope:registry=https://npm.example.com/\n//npm.example.com/:_authToken=npm_secret\n',
    npmrcPath: '/repo/.npmrc',
    packages: [],
    rootDependencies: {},
    settings: {},
  });
  const context = { lowdefyVersion: '5.5.1', logger: { debug: jest.fn(), warn: jest.fn() } };
  await ensurePnpmWorkspaceYaml({ context, directory: '/repo/app/.lowdefy/dev' });
  expect(readFile.mock.calls).toEqual([['/repo/app/.lowdefy/dev/.npmrc']]);
  expect(writeFileIfChanged.mock.calls[1]).toEqual([
    '/repo/app/.lowdefy/dev/.npmrc',
    `# >>> Copied by Lowdefy from /repo/.npmrc; rewritten on every run.
@scope:registry=https://npm.example.com/
# <<< End of the lines copied by Lowdefy.
strict-peer-dependencies=false
`,
  ]);
  expect(context.logger.warn.mock.calls).toEqual([
    [
      '"//npm.example.com/:_authToken" in /repo/.npmrc holds a credential, so it is not copied to the server\'s .npmrc. Reference an environment variable instead (//npm.example.com/:_authToken=${NPM_TOKEN}), or move the line to your user ~/.npmrc.',
    ],
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
  readParentWorkspace.mockResolvedValue({
    npmrc: null,
    npmrcPath: '/repo/.npmrc',
    packages: [],
    rootDependencies: {},
    settings: {},
  });
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
