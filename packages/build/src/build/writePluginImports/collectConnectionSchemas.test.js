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

const mockResolve = jest.fn();
const mockRunWorker = jest.fn();
jest.unstable_mockModule('./resolveConnectionPackage.js', () => ({ default: mockResolve }));
jest.unstable_mockModule('./runConnectionSchemaWorker.js', () => ({ default: mockRunWorker }));

const { default: collectConnectionSchemas } = await import('./collectConnectionSchemas.js');
const { default: connectionSchemaCache } = await import('./connectionSchemaCache.js');

const context = { directories: { server: '/server' } };

function schemasFor(packageName) {
  return { connections: { [packageName]: { schema: {}, requests: [] } }, requests: {} };
}

function installed({ version = '1.0.0' } = {}) {
  return ({ packageName }) => ({
    directory: `/server/node_modules/${packageName}`,
    version,
    cacheable: true,
  });
}

beforeEach(() => {
  connectionSchemaCache.clear();
  mockRunWorker.mockImplementation(async ({ packageNames }) =>
    Object.fromEntries(packageNames.map((packageName) => [packageName, schemasFor(packageName)]))
  );
});

test('collectConnectionSchemas collects every package in one worker', async () => {
  mockResolve.mockImplementation(installed());

  const collected = await collectConnectionSchemas({ context, packageNames: ['a', 'b'] });

  expect(collected).toEqual({ a: schemasFor('a'), b: schemasFor('b') });
  expect(mockRunWorker).toHaveBeenCalledTimes(1);
  expect(mockRunWorker).toHaveBeenCalledWith({
    packageNames: ['a', 'b'],
    serverDirectory: '/server',
  });
});

test('collectConnectionSchemas starts no worker when every installed package is cached', async () => {
  mockResolve.mockImplementation(installed());

  await collectConnectionSchemas({ context, packageNames: ['a', 'b'] });
  const second = await collectConnectionSchemas({ context, packageNames: ['a', 'b'] });

  expect(second).toEqual({ a: schemasFor('a'), b: schemasFor('b') });
  expect(mockRunWorker).toHaveBeenCalledTimes(1);
});

test('collectConnectionSchemas starts no worker when there are no packages', async () => {
  expect(await collectConnectionSchemas({ context, packageNames: [] })).toEqual({});
  expect(mockRunWorker).not.toHaveBeenCalled();
});

test('collectConnectionSchemas collects a package again when its version changes', async () => {
  mockResolve.mockImplementation(installed({ version: '1.0.0' }));
  await collectConnectionSchemas({ context, packageNames: ['a', 'b'] });

  mockResolve.mockImplementation(({ packageName }) =>
    installed({ version: packageName === 'a' ? '1.1.0' : '1.0.0' })({ packageName })
  );
  await collectConnectionSchemas({ context, packageNames: ['a', 'b'] });

  expect(mockRunWorker).toHaveBeenCalledTimes(2);
  expect(mockRunWorker.mock.calls[1][0].packageNames).toEqual(['a']);
});

test('collectConnectionSchemas collects a local or linked package on every build', async () => {
  mockResolve.mockImplementation(({ packageName }) => ({
    directory: `/repo/plugins/${packageName}`,
    version: '1.0.0',
    cacheable: false,
  }));

  await collectConnectionSchemas({ context, packageNames: ['local'] });
  await collectConnectionSchemas({ context, packageNames: ['local'] });

  expect(mockRunWorker).toHaveBeenCalledTimes(2);
});

test('collectConnectionSchemas leaves a package it cannot resolve to the worker, uncached', async () => {
  mockResolve.mockReturnValue(null);
  mockRunWorker.mockResolvedValue({ missing: null });

  expect(await collectConnectionSchemas({ context, packageNames: ['missing'] })).toEqual({
    missing: null,
  });
  await collectConnectionSchemas({ context, packageNames: ['missing'] });
  expect(mockRunWorker).toHaveBeenCalledTimes(2);
});

test('collectConnectionSchemas caches nothing when the worker fails', async () => {
  mockResolve.mockImplementation(installed());
  mockRunWorker.mockRejectedValueOnce(new Error('Cannot find module "mongodb".'));

  await expect(collectConnectionSchemas({ context, packageNames: ['a'] })).rejects.toThrow(
    'Cannot find module "mongodb".'
  );
  await collectConnectionSchemas({ context, packageNames: ['a'] });
  expect(mockRunWorker).toHaveBeenCalledTimes(2);
});
