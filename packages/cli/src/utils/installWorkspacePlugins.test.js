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
  findPnpmWorkspaceRoot: jest.fn(),
  readFile: jest.fn(),
  spawnProcess: jest.fn(),
}));

const workspaceRoot = path.resolve('/repo');
const directory = path.join(workspaceRoot, 'apps', 'web', 'deploy');

const context = {
  logger: { debug: jest.fn(), info: jest.fn() },
  pnpmCmd: 'pnpm',
};

async function setup({ dependencies, root = workspaceRoot }) {
  const { findPnpmWorkspaceRoot, readFile } = await import('@lowdefy/node-utils');
  findPnpmWorkspaceRoot.mockReturnValue(root);
  readFile.mockResolvedValue(JSON.stringify({ name: '@lowdefy/server', dependencies }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('installWorkspacePlugins installs the linked workspace plugins in the parent workspace', async () => {
  const { findPnpmWorkspaceRoot, spawnProcess } = await import('@lowdefy/node-utils');
  const { default: installWorkspacePlugins } = await import('./installWorkspacePlugins.js');
  await setup({
    dependencies: {
      '@lowdefy/server-core': '4.0.0',
      '@acme/plugins': 'link:../../../plugins/acme-plugins',
      '@acme/blocks': 'link:../../../plugins/acme-blocks',
    },
  });
  await installWorkspacePlugins({ context, directory });
  expect(findPnpmWorkspaceRoot.mock.calls).toEqual([[path.dirname(directory)]]);
  expect(spawnProcess.mock.calls).toEqual([
    [
      {
        command: 'pnpm',
        args: [
          'install',
          '--frozen-lockfile',
          '--filter',
          '@acme/plugins...',
          '--filter',
          '@acme/blocks...',
        ],
        stdOutLineHandler: expect.any(Function),
        processOptions: {
          cwd: workspaceRoot,
          shell: process.platform === 'win32',
        },
      },
    ],
  ]);
});

test('installWorkspacePlugins does nothing outside a pnpm workspace', async () => {
  const { readFile, spawnProcess } = await import('@lowdefy/node-utils');
  const { default: installWorkspacePlugins } = await import('./installWorkspacePlugins.js');
  await setup({
    dependencies: { '@acme/plugins': 'link:../acme-plugins' },
    root: null,
  });
  await installWorkspacePlugins({ context, directory });
  expect(readFile).not.toHaveBeenCalled();
  expect(spawnProcess).not.toHaveBeenCalled();
});

test('installWorkspacePlugins does nothing when no dependency links into the workspace', async () => {
  const { spawnProcess } = await import('@lowdefy/node-utils');
  const { default: installWorkspacePlugins } = await import('./installWorkspacePlugins.js');
  await setup({
    dependencies: {
      '@lowdefy/server-core': '4.0.0',
      '@acme/outside': 'link:../../../../elsewhere/acme',
      '@acme/file': 'file:../../../plugins/acme-file',
    },
  });
  await installWorkspacePlugins({ context, directory });
  expect(spawnProcess).not.toHaveBeenCalled();
});

test('installWorkspacePlugins does nothing when the server has no dependencies', async () => {
  const { spawnProcess } = await import('@lowdefy/node-utils');
  const { default: installWorkspacePlugins } = await import('./installWorkspacePlugins.js');
  await setup({ dependencies: undefined });
  await installWorkspacePlugins({ context, directory });
  expect(spawnProcess).not.toHaveBeenCalled();
});

test('installWorkspacePlugins names the plugins and the workspace when the install fails', async () => {
  const { spawnProcess } = await import('@lowdefy/node-utils');
  const { default: installWorkspacePlugins } = await import('./installWorkspacePlugins.js');
  await setup({
    dependencies: { '@acme/plugins': 'link:../../../plugins/acme-plugins' },
  });
  const cause = new Error('ERR_PNPM_OUTDATED_LOCKFILE');
  spawnProcess.mockRejectedValueOnce(cause);
  const error = await installWorkspacePlugins({ context, directory }).catch((e) => e);
  expect(error.message).toBe(
    `Installing the workspace plugins @acme/plugins in ${workspaceRoot} failed. If the workspace lockfile is out of date, run pnpm install there.`
  );
  expect(error.cause).toBe(cause);
});
