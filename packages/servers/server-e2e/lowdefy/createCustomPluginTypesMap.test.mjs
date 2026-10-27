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

import { vi, beforeEach, expect, test } from 'vitest';

const pluginYaml = `
plugins:
  - name: fake-plugin
    version: 1.0.0
`;

const shellPluginYaml = `
plugins:
  - name: fake-plugin
    version: 1.0.0
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
`;

const nativeOnlyYaml = `
mobile:
  shells:
    - id: field
      plugins:
        - name: '@example/lowdefy-printer'
          version: 2.1.0
          typePrefix: Printer
        - name: '@example/lowdefy-mdm'
          version: 1.0.3
          options: { tenant: field-team }
`;

const rootNativeOnlyYaml = `
plugins:
  - name: '@example/lowdefy-mdm'
    version: 1.0.3
`;

const printerTypes = {
  blocks: ['WebLabel'],
  native: {
    actions: ['Print'],
    blockMetas: { Label: { category: 'display' } },
    blocks: ['Label'],
    icons: { Label: ['printer'] },
  },
};

const pluginTypesEsm = {
  __esModule: true,
  default: {
    actions: ['FakeAction'],
    blocks: ['FakeBlock'],
    blockMetas: {
      FakeBlock: { category: 'display' },
    },
    operators: {
      client: ['_fakeClientOp'],
      server: ['_fakeServerOp'],
    },
    requests: ['FakeRequest'],
    icons: {
      FakeBlock: 'icon-name',
    },
  },
};

// The module under test imports @lowdefy/build, which links against every
// export it uses, so the real module passes through and only file access is
// replaced.
const realNodeUtils = await import('@lowdefy/node-utils');
vi.doMock('@lowdefy/node-utils', () => ({
  ...realNodeUtils,
  cleanDirectory: vi.fn(),
  copyFileOrDirectory: vi.fn(),
  getFileExtension: vi.fn(),
  getFileSubExtension: vi.fn(),
  getSecretsFromEnv: vi.fn(),
  spawnProcess: vi.fn(),
  readFile: vi.fn(async () => pluginYaml),
  writeFile: vi.fn(),
  writeFileIfChanged: vi.fn(),
  installIfPackageJsonChanged: vi.fn(),
  // @example/lowdefy-mdm exports ./shell alone, a native-only shell plugin.
  hasTypesExport: vi.fn(({ name }) => name !== '@example/lowdefy-mdm'),
}));

// Modules the test does not fake (those @lowdefy/build loads, such as twrnc) load as usual.
const realModule = await import('node:module');
vi.doMock('node:module', () => ({
  ...realModule,
  createRequire: (from) => (moduleName) => {
    if (moduleName === 'fake-plugin/types') {
      return pluginTypesEsm;
    }
    if (moduleName === '@example/lowdefy-printer/types') {
      return printerTypes;
    }
    if (moduleName === '@example/lowdefy-mdm/types') {
      const error = new Error(
        'Package subpath \'./types\' is not defined by "exports" in @example/lowdefy-mdm/package.json'
      );
      error.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
      throw error;
    }
    return realModule.createRequire(from)(moduleName);
  },
}));

// Imported once, after the mocks: it loads @lowdefy/build, which takes seconds.
const { default: createCustomPluginTypesMap } = await import('./createCustomPluginTypesMap.mjs');

beforeEach(() => {
  vi.clearAllMocks();
});

test('unwraps ESM default export when loading plugin types', async () => {
  const { customTypesMap: result } = await createCustomPluginTypesMap({
    directories: { config: '/config' },
  });
  expect(result.actions).toEqual({
    FakeAction: { package: 'fake-plugin', originalTypeName: 'FakeAction', version: '1.0.0' },
  });
  expect(result.blocks).toEqual({
    FakeBlock: { package: 'fake-plugin', originalTypeName: 'FakeBlock', version: '1.0.0' },
  });
  expect(result.operators.client).toEqual({
    _fakeClientOp: { package: 'fake-plugin', originalTypeName: '_fakeClientOp', version: '1.0.0' },
  });
  expect(result.operators.server).toEqual({
    _fakeServerOp: { package: 'fake-plugin', originalTypeName: '_fakeServerOp', version: '1.0.0' },
  });
  expect(result.requests).toEqual({
    FakeRequest: { package: 'fake-plugin', originalTypeName: 'FakeRequest', version: '1.0.0' },
  });
});

test('populates blockMetas from plugin types', async () => {
  const { customTypesMap: result } = await createCustomPluginTypesMap({
    directories: { config: '/config' },
  });
  expect(result.blockMetas).toEqual({
    FakeBlock: { category: 'display' },
  });
});

test('populates icons from plugin types', async () => {
  const { customTypesMap: result } = await createCustomPluginTypesMap({
    directories: { config: '/config' },
  });
  expect(result.icons).toEqual({
    FakeBlock: 'icon-name',
  });
});

test('returns empty typesMap when neither lowdefy.yaml nor lowdefy.yml exists', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  readFile.mockResolvedValue(undefined);
  const { customTypesMap: result } = await createCustomPluginTypesMap({
    directories: { config: '/config' },
  });
  expect(result.actions).toEqual({});
  expect(result.blocks).toEqual({});
  expect(result.blockMetas).toEqual({});
  expect(result.icons).toEqual({});
  expect(result.requests).toEqual({});
  expect(result.operators).toEqual({ client: {}, server: {} });
});

test('registers shell plugin native types in the mobile map and web types in the web map', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  readFile.mockResolvedValue(shellPluginYaml);
  const { customTypesMap, customTypesMapMobile } = await createCustomPluginTypesMap({
    directories: { config: '/config' },
  });
  expect(customTypesMapMobile).toEqual({
    actions: {
      PrinterPrint: {
        package: '@example/lowdefy-printer',
        originalTypeName: 'Print',
        version: '2.1.0',
      },
    },
    blockMetas: { PrinterLabel: { category: 'display' } },
    blocks: {
      PrinterLabel: {
        package: '@example/lowdefy-printer',
        originalTypeName: 'Label',
        version: '2.1.0',
      },
    },
    icons: { PrinterLabel: ['printer'] },
    operators: { client: {} },
    plugins: ['@example/lowdefy-printer'],
  });
  expect(customTypesMap.blocks.PrinterWebLabel).toEqual({
    package: '@example/lowdefy-printer',
    originalTypeName: 'WebLabel',
    version: '2.1.0',
  });
  expect(customTypesMap.blocks.PrinterLabel).toBeUndefined();
  expect(customTypesMap.actions.PrinterPrint).toBeUndefined();
});

test('a shell-only plugin without ./types adds no types and stays listed in the mobile map', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  readFile.mockResolvedValue(nativeOnlyYaml);
  const { customTypesMap, customTypesMapMobile } = await createCustomPluginTypesMap({
    directories: { config: '/config' },
  });
  expect(customTypesMapMobile.plugins).toEqual([
    '@example/lowdefy-printer',
    '@example/lowdefy-mdm',
  ]);
  expect(Object.keys(customTypesMapMobile.blocks)).toEqual(['PrinterLabel']);
  expect(Object.keys(customTypesMapMobile.actions)).toEqual(['PrinterPrint']);
  expect(Object.keys(customTypesMap.blocks)).toEqual(['PrinterWebLabel']);
});

test('a root plugin without ./types still fails', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  readFile.mockResolvedValue(rootNativeOnlyYaml);
  await expect(createCustomPluginTypesMap({ directories: { config: '/config' } })).rejects.toThrow(
    'Package subpath \'./types\' is not defined by "exports"'
  );
});
