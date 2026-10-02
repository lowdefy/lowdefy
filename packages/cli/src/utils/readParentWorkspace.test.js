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
}));

test('readParentWorkspace reads settings from pnpm-workspace.yaml and the package.json pnpm field', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  readFile.mockImplementation(async (filePath) => {
    if (filePath === '/repo/pnpm-workspace.yaml') {
      return `packages:
  - apps/*
  - plugins/*
overrides:
  a: 2.0.0
allowBuilds:
  esbuild: true
shamefullyHoist: true
`;
    }
    return JSON.stringify({
      packageManager: 'pnpm@10.29.2',
      pnpm: {
        overrides: { a: '1.0.0' },
        patchedDependencies: { 'b@1.0.0': 'patches/b@1.0.0.patch' },
      },
    });
  });
  const parentWorkspace = await readParentWorkspace({ workspaceRoot: '/repo' });
  expect(parentWorkspace).toEqual({
    packageManager: 'pnpm@10.29.2',
    packages: ['apps/*', 'plugins/*'],
    settings: {
      allowBuilds: { esbuild: true },
      overrides: { a: '2.0.0' },
      patchedDependencies: { 'b@1.0.0': 'patches/b@1.0.0.patch' },
    },
  });
});

test('readParentWorkspace returns empty settings for a workspace with no package.json or settings', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  readFile.mockImplementation(async (filePath) =>
    filePath === '/repo/pnpm-workspace.yaml' ? '' : null
  );
  const parentWorkspace = await readParentWorkspace({ workspaceRoot: '/repo' });
  expect(parentWorkspace).toEqual({
    packageManager: undefined,
    packages: [],
    settings: {},
  });
});
