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

jest.unstable_mockModule('./findWorkspacePackages.js', () => ({
  default: jest.fn(),
}));

const workspaceRoot = '/repo';
const packages = ['apps/*', 'plugins/*'];

beforeEach(() => {
  jest.clearAllMocks();
});

test('resolveVersionReference returns specs that are not "$name" references unchanged', async () => {
  const { default: resolveVersionReference } = await import('./resolveVersionReference.js');
  expect(
    resolveVersionReference({
      packages,
      rootDependencies: {},
      settings: {},
      spec: '^1.0.0',
      workspaceRoot,
    })
  ).toEqual('^1.0.0');
});

test('resolveVersionReference resolves "$name" to the parent root dependency version', async () => {
  const { default: resolveVersionReference } = await import('./resolveVersionReference.js');
  expect(
    resolveVersionReference({
      packages,
      rootDependencies: { a: '^2.0.0' },
      settings: {},
      spec: '$a',
      workspaceRoot,
    })
  ).toEqual('^2.0.0');
});

test('resolveVersionReference resolves a "workspace:" root dependency to a link: to the workspace package', async () => {
  const { default: findWorkspacePackages } = await import('./findWorkspacePackages.js');
  const { default: resolveVersionReference } = await import('./resolveVersionReference.js');
  findWorkspacePackages.mockReturnValue(new Map([['@scope/a', '/repo/plugins/a']]));
  expect(
    resolveVersionReference({
      packages,
      rootDependencies: { '@scope/a': 'workspace:*' },
      settings: {},
      spec: '$@scope/a',
      workspaceRoot,
    })
  ).toEqual('link:plugins/a');
  expect(findWorkspacePackages.mock.calls).toEqual([[{ packages, workspaceRoot }]]);
});

test('resolveVersionReference throws when a "workspace:" root dependency is not a workspace package', async () => {
  const { default: findWorkspacePackages } = await import('./findWorkspacePackages.js');
  const { default: resolveVersionReference } = await import('./resolveVersionReference.js');
  findWorkspacePackages.mockReturnValue(new Map());
  expect(() =>
    resolveVersionReference({
      packages,
      rootDependencies: { a: 'workspace:^1.0.0' },
      settings: {},
      spec: '$a',
      workspaceRoot,
    })
  ).toThrow(
    'Cannot resolve the override version "$a": /repo/package.json has "a": "workspace:^1.0.0", but no package named "a" was found in the pnpm workspace at /repo.'
  );
});

test('resolveVersionReference resolves "catalog:" root dependencies from the default and named catalogs', async () => {
  const { default: resolveVersionReference } = await import('./resolveVersionReference.js');
  const rootDependencies = { a: 'catalog:', b: 'catalog:default', c: 'catalog:legacy' };
  const settings = {
    catalog: { a: '^1.0.0', b: 'link:vendor/b' },
    catalogs: { legacy: { c: '0.9.0' } },
  };
  const resolve = (spec) =>
    resolveVersionReference({ packages, rootDependencies, settings, spec, workspaceRoot });
  expect(resolve('$a')).toEqual('^1.0.0');
  expect(resolve('$b')).toEqual('link:vendor/b');
  expect(resolve('$c')).toEqual('0.9.0');
});

test('resolveVersionReference resolves "catalog:" from catalogs.default when there is no catalog', async () => {
  const { default: resolveVersionReference } = await import('./resolveVersionReference.js');
  expect(
    resolveVersionReference({
      packages,
      rootDependencies: { a: 'catalog:' },
      settings: { catalogs: { default: { a: '3.0.0' } } },
      spec: '$a',
      workspaceRoot,
    })
  ).toEqual('3.0.0');
});

test('resolveVersionReference throws when the catalog has no entry for the dependency', async () => {
  const { default: resolveVersionReference } = await import('./resolveVersionReference.js');
  expect(() =>
    resolveVersionReference({
      packages,
      rootDependencies: { a: 'catalog:legacy' },
      settings: { catalog: { a: '1.0.0' } },
      spec: '$a',
      workspaceRoot,
    })
  ).toThrow(
    'Cannot resolve the override version "$a": /repo/package.json has "a": "catalog:legacy", but the "legacy" catalog in /repo/pnpm-workspace.yaml has no entry for "a".'
  );
});

test('resolveVersionReference throws when the parent root package.json has no such dependency', async () => {
  const { default: resolveVersionReference } = await import('./resolveVersionReference.js');
  expect(() =>
    resolveVersionReference({
      packages,
      rootDependencies: {},
      settings: {},
      spec: '$a',
      workspaceRoot,
    })
  ).toThrow('Cannot resolve the override version "$a": /repo/package.json has no dependency "a".');
});
