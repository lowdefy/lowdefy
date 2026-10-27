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

import writeAvailableTypes from './writeAvailableTypes.js';

const mockWriteBuildArtifact = vi.fn();

function makeTypesMap(overrides = {}) {
  return {
    actions: {},
    agents: {},
    auth: { adapters: {}, callbacks: {}, events: {}, providers: {} },
    blocks: {},
    connections: {},
    notifications: {},
    operators: { client: {}, server: {} },
    requests: {},
    websockets: {},
    ...overrides,
  };
}

function makeTypesMapMobile(overrides = {}) {
  return {
    actions: {},
    blockMetas: {},
    blocks: {},
    icons: {},
    operators: { client: {} },
    ...overrides,
  };
}

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeAvailableTypes writes installed typesMap types', async () => {
  const context = {
    typesMap: makeTypesMap({
      blocks: {
        Button: { package: '@lowdefy/blocks-antd', originalTypeName: 'Button', version: '5.0.0' },
      },
      requests: {
        MongoDBFind: {
          package: '@lowdefy/connection-mongodb',
          originalTypeName: 'MongoDBFind',
          version: '5.0.0',
        },
      },
    }),
    installedPackages: new Set(['@lowdefy/blocks-antd', '@lowdefy/connection-mongodb']),
    typesMapMobile: makeTypesMapMobile(),
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeAvailableTypes({ context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(mockWriteBuildArtifact.mock.calls[0][0]).toEqual('plugins/availableTypes.json');
  expect(written.blocks.Button.package).toEqual('@lowdefy/blocks-antd');
  expect(written.requests.MongoDBFind.package).toEqual('@lowdefy/connection-mongodb');
});

test('writeAvailableTypes skips writing when installedPackages is not set (production build)', async () => {
  const context = {
    typesMap: makeTypesMap(),
    typesMapMobile: makeTypesMapMobile(),
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeAvailableTypes({ context });
  expect(mockWriteBuildArtifact).not.toHaveBeenCalled();
});

test('writeAvailableTypes filters types to installed packages', async () => {
  const context = {
    typesMap: makeTypesMap({
      blocks: {
        Button: { package: '@lowdefy/blocks-antd', originalTypeName: 'Button', version: '5.0.0' },
        Chart: { package: '@lowdefy/blocks-echarts', originalTypeName: 'Chart', version: '5.0.0' },
      },
    }),
    installedPackages: new Set(['@lowdefy/blocks-antd']),
    typesMapMobile: makeTypesMapMobile(),
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeAvailableTypes({ context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written.blocks.Button).toBeDefined();
  expect(written.blocks.Chart).toBeUndefined();
});

test('writeAvailableTypes includes operator client and server stores separately', async () => {
  const context = {
    typesMap: makeTypesMap({
      operators: {
        client: {
          _get: { package: '@lowdefy/operators-js', originalTypeName: '_get', version: '5.0.0' },
        },
        server: {
          _get: { package: '@lowdefy/operators-js', originalTypeName: '_get', version: '5.0.0' },
          _secret: {
            package: '@lowdefy/operators-js',
            originalTypeName: '_secret',
            version: '5.0.0',
          },
        },
      },
    }),
    installedPackages: new Set(['@lowdefy/operators-js']),
    typesMapMobile: makeTypesMapMobile(),
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeAvailableTypes({ context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(Object.keys(written.operators.client)).toEqual(['_get']);
  expect(Object.keys(written.operators.server)).toEqual(['_get', '_secret']);
});

test('writeAvailableTypes writes auth type stores', async () => {
  const context = {
    typesMap: makeTypesMap({
      auth: {
        adapters: {
          MongoDBAdapter: {
            package: '@lowdefy/connection-mongodb',
            originalTypeName: 'MongoDBAdapter',
            version: '5.0.0',
          },
        },
        callbacks: {},
        events: {},
        providers: {},
      },
    }),
    installedPackages: new Set(['@lowdefy/connection-mongodb']),
    typesMapMobile: makeTypesMapMobile(),
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeAvailableTypes({ context });
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[0][1]);
  expect(written.auth.adapters.MongoDBAdapter).toBeDefined();
  expect(written.auth.providers).toEqual({});
});

test('writeAvailableTypes writes the native shell types, unfiltered, to availableTypesMobile.json', async () => {
  const context = {
    typesMap: makeTypesMap(),
    typesMapMobile: makeTypesMapMobile({
      actions: {
        SetState: {
          package: '@lowdefy/actions-core',
          originalTypeName: 'SetState',
          version: '7.0.0',
        },
      },
      blockMetas: { Button: { category: 'display' } },
      blocks: {
        Button: { package: '@lowdefy/blocks-native', originalTypeName: 'Button', version: '7.0.0' },
      },
      operators: {
        client: {
          _state: {
            package: '@lowdefy/operators-js',
            originalTypeName: '_state',
            version: '7.0.0',
          },
        },
      },
    }),
    installedPackages: new Set(),
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeAvailableTypes({ context });
  expect(mockWriteBuildArtifact.mock.calls[1][0]).toEqual('plugins/availableTypesMobile.json');
  const written = JSON.parse(mockWriteBuildArtifact.mock.calls[1][1]);
  expect(Object.keys(written.blocks)).toEqual(['Button']);
  expect(Object.keys(written.actions)).toEqual(['SetState']);
  expect(Object.keys(written.operators.client)).toEqual(['_state']);
  expect(written.blockMetas.Button.category).toEqual('display');
});
