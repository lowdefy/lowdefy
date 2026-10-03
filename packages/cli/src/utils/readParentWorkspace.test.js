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
  readFile: jest.fn(),
}));

jest.unstable_mockModule('./getPnpmMajorVersion.js', () => ({
  default: jest.fn(),
}));

const directory = '/repo/apps/app/.lowdefy/server';
const pnpmCmd = 'pnpm';

beforeEach(async () => {
  jest.clearAllMocks();
  const { default: getPnpmMajorVersion } = await import('./getPnpmMajorVersion.js');
  getPnpmMajorVersion.mockReturnValue(10);
});

function mockFiles(readFile, files) {
  readFile.mockImplementation(async (filePath) => files[filePath] ?? null);
}

test('readParentWorkspace carries every pnpm-workspace.yaml setting except packages', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(false);
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': `packages:
  - apps/*
  - plugins/*
overrides:
  a: 2.0.0
allowBuilds:
  esbuild: true
supportedArchitectures:
  os: [current, linux]
minimumReleaseAge: 1440
nodeLinker: hoisted
`,
    '/repo/package.json': JSON.stringify({
      packageManager: 'pnpm@10.29.2',
      dependencies: { c: '3.0.0' },
      devDependencies: { c: '2.0.0', d: '4.0.0' },
    }),
  });
  const parentWorkspace = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(parentWorkspace).toEqual({
    devEnginesPackageManager: undefined,
    npmrc: null,
    npmrcPath: '/repo/.npmrc',
    packageManager: 'pnpm@10.29.2',
    packages: ['apps/*', 'plugins/*'],
    rootDependencies: { c: '3.0.0', d: '4.0.0' },
    settings: {
      allowBuilds: { esbuild: true },
      minimumReleaseAge: 1440,
      nodeLinker: 'hoisted',
      overrides: { a: '2.0.0' },
      supportedArchitectures: { os: ['current', 'linux'] },
    },
  });
});

test('readParentWorkspace reads the package.json pnpm field and resolutions over pnpm-workspace.yaml when pnpm 10 installs', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(false);
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': `packages:
  - apps/*
peerDependencyRules:
  ignoreMissing: [b]
`,
    '/repo/package.json': JSON.stringify({
      resolutions: { a: '1.0.0', e: '5.0.0' },
      pnpm: {
        overrides: { a: '2.0.0' },
        patchedDependencies: { 'b@1.0.0': 'patches/b@1.0.0.patch' },
        peerDependencyRules: { ignoreMissing: ['c'] },
        supportedArchitectures: { cpu: ['x64'] },
        notAPnpmSetting: true,
      },
    }),
  });
  const { settings } = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(settings).toEqual({
    overrides: { a: '2.0.0', e: '5.0.0' },
    patchedDependencies: { 'b@1.0.0': 'patches/b@1.0.0.patch' },
    peerDependencyRules: { ignoreMissing: ['c'] },
    supportedArchitectures: { cpu: ['x64'] },
  });
});

test('readParentWorkspace leaves out the package.json pnpm field and resolutions when pnpm 11 installs', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getPnpmMajorVersion } = await import('./getPnpmMajorVersion.js');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(false);
  getPnpmMajorVersion.mockReturnValue(11);
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': 'packages:\n  - apps/*\noverrides:\n  b: 2.0.0\n',
    '/repo/package.json': JSON.stringify({
      packageManager: 'pnpm@11.15.0',
      resolutions: { a: '1.0.0' },
      pnpm: { overrides: { a: '2.0.0' }, patchedDependencies: { 'c@1.0.0': 'c.patch' } },
    }),
  });
  const { settings } = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(settings).toEqual({ overrides: { b: '2.0.0' } });
  expect(getPnpmMajorVersion.mock.calls).toEqual([
    [
      {
        directory,
        packageJson: {
          packageManager: 'pnpm@11.15.0',
          resolutions: { a: '1.0.0' },
          pnpm: { overrides: { a: '2.0.0' }, patchedDependencies: { 'c@1.0.0': 'c.patch' } },
        },
        pnpmCmd,
      },
    ],
  ]);
});

test('readParentWorkspace returns the parent devEngines.packageManager pin', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(false);
  const devEngines = {
    packageManager: { name: 'pnpm', version: '^11.0.0', onFail: 'download' },
    runtime: { name: 'node', version: '^24.0.0' },
  };
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    '/repo/package.json': JSON.stringify({ devEngines }),
  });
  const parentWorkspace = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(parentWorkspace.devEnginesPackageManager).toEqual(devEngines.packageManager);
  expect(parentWorkspace.packageManager).toBeUndefined();
});

test('readParentWorkspace reads the parent .npmrc', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(false);
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    '/repo/.npmrc': '@scope:registry=https://npm.example.com/\n',
  });
  const parentWorkspace = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(parentWorkspace.npmrc).toEqual('@scope:registry=https://npm.example.com/\n');
  expect(parentWorkspace.npmrcPath).toEqual('/repo/.npmrc');
});

test('readParentWorkspace sets pnpmfile to the default pnpmfile at the parent root', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockImplementation((filePath) => filePath === '/repo/.pnpmfile.cjs');
  mockFiles(readFile, { '/repo/pnpm-workspace.yaml': 'packages:\n  - apps/*\n' });
  const { settings } = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(settings).toEqual({ pnpmfile: '.pnpmfile.cjs' });
});

test('readParentWorkspace does not set the default pnpmfile when the parent .npmrc sets pnpmfile', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockImplementation((filePath) => filePath === '/repo/.pnpmfile.cjs');
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    '/repo/.npmrc': 'pnpmfile = hooks/pnpmfile.cjs\n',
  });
  const { settings } = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(settings).toEqual({});
});

test('readParentWorkspace sets the default pnpmfile when pnpm 11, which ignores pnpmfile in .npmrc, installs', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: getPnpmMajorVersion } = await import('./getPnpmMajorVersion.js');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockImplementation((filePath) => filePath === '/repo/.pnpmfile.cjs');
  getPnpmMajorVersion.mockReturnValue(11);
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    '/repo/.npmrc': 'pnpmfile=hooks/pnpmfile.cjs\n',
  });
  const { settings } = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(settings).toEqual({ pnpmfile: '.pnpmfile.cjs' });
});

test('readParentWorkspace keeps a pnpmfile the parent sets', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(true);
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': 'packages:\n  - apps/*\npnpmfile: hooks/pnpmfile.cjs\n',
  });
  const { settings } = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(settings).toEqual({ pnpmfile: 'hooks/pnpmfile.cjs' });
});

test('readParentWorkspace returns empty settings for a workspace with no package.json or settings', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(false);
  mockFiles(readFile, { '/repo/pnpm-workspace.yaml': '' });
  const parentWorkspace = await readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' });
  expect(parentWorkspace).toEqual({
    devEnginesPackageManager: undefined,
    npmrc: null,
    npmrcPath: '/repo/.npmrc',
    packageManager: undefined,
    packages: [],
    rootDependencies: {},
    settings: {},
  });
});

test('readParentWorkspace names pnpm-workspace.yaml when it cannot be parsed', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(false);
  mockFiles(readFile, { '/repo/pnpm-workspace.yaml': 'packages: [apps/*\n' });
  await expect(readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' })).rejects.toThrow(
    /^Could not parse \/repo\/pnpm-workspace\.yaml: /
  );
});

test('readParentWorkspace names package.json when it cannot be parsed', async () => {
  const { default: fs } = await import('fs');
  const { readFile } = await import('@lowdefy/node-utils');
  const { default: readParentWorkspace } = await import('./readParentWorkspace.js');
  fs.existsSync.mockReturnValue(false);
  mockFiles(readFile, {
    '/repo/pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    '/repo/package.json': '{ "name": ',
  });
  await expect(readParentWorkspace({ directory, pnpmCmd, workspaceRoot: '/repo' })).rejects.toThrow(
    /^Could not parse \/repo\/package\.json: /
  );
});
