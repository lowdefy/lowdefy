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

import { vi, expect, test } from 'vitest';

const mockImportFresh = vi.fn();
vi.doMock('./importFresh.mjs', () => ({ default: mockImportFresh }));
const mockCreatePluginTypesMap = vi.fn();
const mockCreatePluginTypesMapMobile = vi.fn();
vi.doMock('@lowdefy/build', () => ({
  createPluginTypesMap: mockCreatePluginTypesMap,
  createPluginTypesMapMobile: mockCreatePluginTypesMapMobile,
}));
// The module under test imports @lowdefy/build, which links against every
// export it uses, so the real module passes through and only readFile is
// replaced.
const realNodeUtils = await import('@lowdefy/node-utils');
const mockReadFile = vi.fn(async () => 'plugins:\n  - name: plugin-a\n  - name: plugin-b\n');
// @example/lowdefy-mdm exports ./shell alone, a native-only shell plugin.
const mockHasTypesExport = vi.fn(({ name }) => name !== '@example/lowdefy-mdm');
vi.doMock('@lowdefy/node-utils', () => ({
  ...realNodeUtils,
  hasTypesExport: mockHasTypesExport,
  readFile: mockReadFile,
}));
vi.doMock('node:module', () => ({
  createRequire: () => ({ resolve: (name) => `/plugins/${name}.js` }),
}));

const { default: createCustomPluginTypesMap } = await import('./createCustomPluginTypesMap.mjs');
const { default: createCustomPluginMessagesMap } = await import(
  './createCustomPluginMessagesMap.mjs'
);

const logger = { debug: vi.fn(), error: vi.fn(), info: vi.fn() };
const directories = { config: '/app' };

// Holds every import open until release(), so a test can see which imports
// started before any of them finished.
function deferImports(values) {
  const releases = [];
  mockImportFresh.mockImplementation(
    (filePath) =>
      new Promise((resolve) => {
        releases.push(() => resolve(values[filePath]));
      })
  );
  return {
    started: () => mockImportFresh.mock.calls.map(([filePath]) => filePath),
    release: () => releases.forEach((release) => release()),
  };
}

test('createCustomPluginTypesMap imports every plugin before any import finishes', async () => {
  const imports = deferImports({
    '/plugins/plugin-a/types.js': { blocks: ['A'] },
    '/plugins/plugin-b/types.js': { blocks: ['B'] },
  });

  const result = createCustomPluginTypesMap({ directories, logger });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(imports.started()).toEqual(['/plugins/plugin-a/types.js', '/plugins/plugin-b/types.js']);
  imports.release();
  await result;

  expect(mockCreatePluginTypesMap.mock.calls.map(([args]) => args.packageName)).toEqual([
    'plugin-a',
    'plugin-b',
  ]);
});

test('createCustomPluginMessagesMap imports every plugin before any import finishes', async () => {
  const imports = deferImports({
    '/plugins/plugin-a/messages.js': { hello: 'A' },
    '/plugins/plugin-b/messages.js': { hello: 'B' },
  });

  const result = createCustomPluginMessagesMap({ directories, logger });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(imports.started()).toEqual([
    '/plugins/plugin-a/messages.js',
    '/plugins/plugin-b/messages.js',
  ]);
  imports.release();

  expect(await result).toEqual({ 'plugin-a': { hello: 'A' }, 'plugin-b': { hello: 'B' } });
});

test('createCustomPluginTypesMap imports a plugin in root and two shells once and reads its native types', async () => {
  mockCreatePluginTypesMap.mockClear();
  mockReadFile.mockResolvedValueOnce(`
plugins:
  - name: '@example/lowdefy-printer'
    version: 2.1.0
mobile:
  shells:
    - id: field
      plugins:
        - name: '@example/lowdefy-printer'
          version: 2.1.0
          typePrefix: Printer
    - id: staging
      plugins:
        - name: '@example/lowdefy-printer'
          version: 2.1.0
          typePrefix: Printer
`);
  const printerTypes = { native: { blocks: ['Label'] } };
  mockImportFresh.mockReset();
  mockImportFresh.mockResolvedValue(printerTypes);

  const { customTypesMapMobile } = await createCustomPluginTypesMap({ directories, logger });

  expect(mockImportFresh.mock.calls).toEqual([['/plugins/@example/lowdefy-printer/types.js']]);
  expect(mockCreatePluginTypesMap.mock.calls.map(([args]) => args.typePrefix)).toEqual([undefined]);
  expect(mockCreatePluginTypesMapMobile.mock.calls).toEqual([
    [
      {
        packageName: '@example/lowdefy-printer',
        packageTypes: printerTypes,
        typePrefix: 'Printer',
        typesMap: customTypesMapMobile,
        version: '2.1.0',
      },
    ],
  ]);
  expect(customTypesMapMobile.plugins).toEqual(['@example/lowdefy-printer']);
});

test('createCustomPluginTypesMap skips ./types of a shell-only plugin that does not export it', async () => {
  mockCreatePluginTypesMap.mockClear();
  mockCreatePluginTypesMapMobile.mockClear();
  mockReadFile.mockResolvedValueOnce(`
mobile:
  shells:
    - id: field
      plugins:
        - name: '@example/lowdefy-printer'
          version: 2.1.0
          typePrefix: Printer
        - name: '@example/lowdefy-mdm'
          version: 1.0.3
`);
  const printerTypes = { native: { blocks: ['Label'] } };
  mockImportFresh.mockReset();
  mockImportFresh.mockResolvedValue(printerTypes);

  const { customTypesMapMobile } = await createCustomPluginTypesMap({ directories, logger });

  expect(mockImportFresh.mock.calls).toEqual([['/plugins/@example/lowdefy-printer/types.js']]);
  expect(mockCreatePluginTypesMapMobile.mock.calls.map(([args]) => args.packageTypes)).toEqual([
    printerTypes,
    {},
  ]);
  expect(customTypesMapMobile.plugins).toEqual([
    '@example/lowdefy-printer',
    '@example/lowdefy-mdm',
  ]);
});

test('createCustomPluginTypesMap reads ./types of a root plugin without asking whether it exports it', async () => {
  mockHasTypesExport.mockClear();
  mockReadFile.mockResolvedValueOnce(`
plugins:
  - name: '@example/lowdefy-mdm'
    version: 1.0.3
`);
  mockImportFresh.mockReset();
  mockImportFresh.mockRejectedValue(new Error('No "./types" export.'));

  await expect(createCustomPluginTypesMap({ directories, logger })).rejects.toThrow(
    'Failed to import plugin "@example/lowdefy-mdm".'
  );
  expect(mockHasTypesExport).not.toHaveBeenCalled();
});
