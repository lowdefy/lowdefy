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

const pluginYaml = `
plugins:
  - name: fake-plugin
    version: 1.0.0
`;

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

jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  cleanDirectory: jest.fn(),
  copyFileOrDirectory: jest.fn(),
  getFileExtension: jest.fn(),
  getFileSubExtension: jest.fn(),
  getSecretsFromEnv: jest.fn(),
  spawnProcess: jest.fn(),
  readFile: jest.fn(async () => pluginYaml),
  writeFile: jest.fn(),
}));

jest.unstable_mockModule('node:module', () => ({
  createRequire: () => (moduleName) => {
    if (moduleName === 'fake-plugin/types') {
      return pluginTypesEsm;
    }
    throw new Error(`Unexpected require: ${moduleName}`);
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('unwraps ESM default export when loading plugin types', async () => {
  const { default: createCustomPluginTypesMap } = await import('./createCustomPluginTypesMap.mjs');
  const result = await createCustomPluginTypesMap({ directories: { config: '/config' } });
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
  const { default: createCustomPluginTypesMap } = await import('./createCustomPluginTypesMap.mjs');
  const result = await createCustomPluginTypesMap({ directories: { config: '/config' } });
  expect(result.blockMetas).toEqual({
    FakeBlock: { category: 'display' },
  });
});

test('populates icons from plugin types', async () => {
  const { default: createCustomPluginTypesMap } = await import('./createCustomPluginTypesMap.mjs');
  const result = await createCustomPluginTypesMap({ directories: { config: '/config' } });
  expect(result.icons).toEqual({
    FakeBlock: 'icon-name',
  });
});

test('returns empty typesMap when neither lowdefy.yaml nor lowdefy.yml exists', async () => {
  const { readFile } = await import('@lowdefy/node-utils');
  readFile.mockResolvedValue(undefined);
  const { default: createCustomPluginTypesMap } = await import('./createCustomPluginTypesMap.mjs');
  const result = await createCustomPluginTypesMap({ directories: { config: '/config' } });
  expect(result.actions).toEqual({});
  expect(result.blocks).toEqual({});
  expect(result.blockMetas).toEqual({});
  expect(result.icons).toEqual({});
  expect(result.requests).toEqual({});
  expect(result.operators).toEqual({ client: {}, server: {} });
});
