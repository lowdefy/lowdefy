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

import rebaseWorkspaceSettings from './rebaseWorkspaceSettings.js';

const directory = '/repo/apps/app/.lowdefy/server';
const workspaceRoot = '/repo';

test('rebaseWorkspaceSettings rebases link: and file: overrides to resolve to the same target', () => {
  const settings = rebaseWorkspaceSettings({
    directory,
    rootDependencies: {},
    settings: {
      overrides: {
        a: 'link:./vendor/a',
        b: 'file:vendor/b.tgz',
        c: 'link:/opt/c',
        d: '1.0.0',
        'e>f': 'npm:g@2.0.0',
      },
    },
    workspaceRoot,
  });
  expect(settings.overrides).toEqual({
    a: 'link:../../../../vendor/a',
    b: 'file:../../../../vendor/b.tgz',
    c: 'link:/opt/c',
    d: '1.0.0',
    'e>f': 'npm:g@2.0.0',
  });
});

test('rebaseWorkspaceSettings resolves "$name" overrides against the parent root dependencies', () => {
  const settings = rebaseWorkspaceSettings({
    directory,
    rootDependencies: { a: '^2.0.0', b: 'link:./vendor/b' },
    settings: { overrides: { a: '$a', 'c>b': '$b' } },
    workspaceRoot,
  });
  expect(settings.overrides).toEqual({ a: '^2.0.0', 'c>b': 'link:../../../../vendor/b' });
});

test('rebaseWorkspaceSettings rebases a "$name" override that resolves to a catalog link:', () => {
  const settings = rebaseWorkspaceSettings({
    directory,
    rootDependencies: { a: 'catalog:' },
    settings: { catalog: { a: 'link:vendor/a' }, overrides: { a: '$a' } },
    workspaceRoot,
  });
  expect(settings.overrides).toEqual({ a: 'link:../../../../vendor/a' });
  expect(settings.catalog).toEqual({ a: 'link:../../../../vendor/a' });
});

test('rebaseWorkspaceSettings throws when a "$name" override has no root dependency', () => {
  expect(() =>
    rebaseWorkspaceSettings({
      directory,
      rootDependencies: {},
      settings: { overrides: { a: '$a' } },
      workspaceRoot,
    })
  ).toThrow('Cannot resolve the override version "$a": /repo/package.json has no dependency "a".');
});

test('rebaseWorkspaceSettings rebases catalogs and package extensions', () => {
  const settings = rebaseWorkspaceSettings({
    directory,
    rootDependencies: {},
    settings: {
      catalog: { a: 'link:vendor/a', react: '18.2.0' },
      catalogs: { legacy: { b: 'file:./vendor/b' } },
      packageExtensions: {
        dayjs: {
          dependencies: { c: 'link:vendor/c' },
          peerDependencies: { d: '*' },
          peerDependenciesMeta: { d: { optional: true } },
        },
      },
    },
    workspaceRoot,
  });
  expect(settings).toEqual({
    catalog: { a: 'link:../../../../vendor/a', react: '18.2.0' },
    catalogs: { legacy: { b: 'file:../../../../vendor/b' } },
    packageExtensions: {
      dayjs: {
        dependencies: { c: 'link:../../../../vendor/c' },
        peerDependencies: { d: '*' },
        peerDependenciesMeta: { d: { optional: true } },
      },
    },
  });
});

test('rebaseWorkspaceSettings rebases patch, pnpmfile and onlyBuiltDependenciesFile paths', () => {
  const settings = rebaseWorkspaceSettings({
    directory,
    rootDependencies: {},
    settings: {
      onlyBuiltDependenciesFile: 'config/built.json',
      patchedDependencies: { 'a@1.0.0': 'patches/a.patch', 'b@1.0.0': '/abs/b.patch' },
      pnpmfile: '.pnpmfile.cjs',
    },
    workspaceRoot,
  });
  expect(settings).toEqual({
    onlyBuiltDependenciesFile: '../../../../config/built.json',
    patchedDependencies: { 'a@1.0.0': '../../../../patches/a.patch', 'b@1.0.0': '/abs/b.patch' },
    pnpmfile: '../../../../.pnpmfile.cjs',
  });
});

test('rebaseWorkspaceSettings rebases store, cache, state and global directories', () => {
  const settings = rebaseWorkspaceSettings({
    directory,
    rootDependencies: {},
    settings: {
      cacheDir: '.cache/pnpm',
      globalBinDir: '/usr/local/bin',
      globalDir: 'global',
      globalPnpmfile: 'hooks/global.cjs',
      stateDir: '~/.local/state/pnpm',
      storeDir: '.pnpm-store',
    },
    workspaceRoot,
  });
  expect(settings).toEqual({
    cacheDir: '../../../../.cache/pnpm',
    globalBinDir: '/usr/local/bin',
    globalDir: '../../../../global',
    globalPnpmfile: '../../../../hooks/global.cjs',
    stateDir: '~/.local/state/pnpm',
    storeDir: '../../../../.pnpm-store',
  });
});

test('rebaseWorkspaceSettings keeps per-project module directories', () => {
  const input = { modulesDir: 'node_modules', virtualStoreDir: 'node_modules/.pnpm' };
  expect(
    rebaseWorkspaceSettings({ directory, rootDependencies: {}, settings: input, workspaceRoot })
  ).toEqual(input);
});

test('rebaseWorkspaceSettings rebases a list of pnpmfiles', () => {
  const settings = rebaseWorkspaceSettings({
    directory,
    rootDependencies: {},
    settings: { pnpmfile: ['hooks/a.cjs', 'hooks/b.mjs'] },
    workspaceRoot,
  });
  expect(settings.pnpmfile).toEqual(['../../../../hooks/a.cjs', '../../../../hooks/b.mjs']);
});

test('rebaseWorkspaceSettings keeps settings without paths unchanged', () => {
  const input = {
    minimumReleaseAge: 1440,
    nodeLinker: 'hoisted',
    supportedArchitectures: { os: ['current', 'linux'], cpu: ['x64', 'arm64'] },
  };
  expect(
    rebaseWorkspaceSettings({ directory, rootDependencies: {}, settings: input, workspaceRoot })
  ).toEqual(input);
});
