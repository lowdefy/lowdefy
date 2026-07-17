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

import createPluginTypesMap from './createPluginTypesMap.js';

function createEmptyTypesMap() {
  return {
    actions: {},
    agents: {},
    auth: { adapters: {}, providers: {} },
    blocks: {},
    connections: {},
    operators: { client: {}, server: {} },
    requests: {},
    steps: {},
    websockets: {},
    icons: {},
    blockMetas: {},
  };
}

test('createPluginTypesMap registers steps from packageTypes.steps', () => {
  const typesMap = createEmptyTypesMap();
  createPluginTypesMap({
    packageName: '@lowdefy/plugin-better-auth',
    packageTypes: { steps: ['BanUser', 'UnbanUser'] },
    typesMap,
    version: '1.0.0',
  });
  expect(typesMap.steps).toEqual({
    BanUser: {
      package: '@lowdefy/plugin-better-auth',
      originalTypeName: 'BanUser',
      version: '1.0.0',
    },
    UnbanUser: {
      package: '@lowdefy/plugin-better-auth',
      originalTypeName: 'UnbanUser',
      version: '1.0.0',
    },
  });
});

test('createPluginTypesMap applies typePrefix to step type names', () => {
  const typesMap = createEmptyTypesMap();
  createPluginTypesMap({
    packageName: '@lowdefy/plugin-better-auth',
    packageTypes: { steps: ['BanUser'] },
    typePrefix: 'MyPrefix_',
    typesMap,
    version: '1.0.0',
  });
  expect(Object.keys(typesMap.steps)).toEqual(['MyPrefix_BanUser']);
});

test('createPluginTypesMap leaves typesMap.steps unchanged when packageTypes.steps is missing', () => {
  const typesMap = createEmptyTypesMap();
  createPluginTypesMap({
    packageName: '@lowdefy/actions-core',
    packageTypes: { actions: ['Link'] },
    typesMap,
    version: '1.0.0',
  });
  expect(typesMap.steps).toEqual({});
});

test('createPluginTypesMap initializes and merges connectionMetas into the typesMap', () => {
  const typesMap = createEmptyTypesMap();
  expect(typesMap.connectionMetas).toBe(undefined);
  createPluginTypesMap({
    packageName: '@lowdefy/connection-mongodb',
    packageTypes: {
      connections: ['MongoDBCollection'],
      connectionMetas: { MongoDBCollection: { tenant: true } },
    },
    typesMap,
    version: '1.0.0',
  });
  expect(typesMap.connectionMetas).toEqual({
    MongoDBCollection: { tenant: true },
  });
});

test('createPluginTypesMap applies typePrefix to connectionMetas type names', () => {
  const typesMap = createEmptyTypesMap();
  createPluginTypesMap({
    packageName: '@lowdefy/connection-mongodb',
    packageTypes: {
      connectionMetas: { MongoDBCollection: { tenant: true } },
    },
    typePrefix: 'MyPrefix_',
    typesMap,
    version: '1.0.0',
  });
  expect(typesMap.connectionMetas).toEqual({
    MyPrefix_MongoDBCollection: { tenant: true },
  });
});

test('createPluginTypesMap merges connectionMetas into an existing store', () => {
  const typesMap = createEmptyTypesMap();
  typesMap.connectionMetas = { ExistingConnection: { tenant: true } };
  createPluginTypesMap({
    packageName: '@lowdefy/connection-mongodb',
    packageTypes: {
      connectionMetas: { MongoDBCollection: { tenant: true } },
    },
    typesMap,
    version: '1.0.0',
  });
  expect(typesMap.connectionMetas).toEqual({
    ExistingConnection: { tenant: true },
    MongoDBCollection: { tenant: true },
  });
});

test('createPluginTypesMap does not initialize connectionMetas when packageTypes has none', () => {
  const typesMap = createEmptyTypesMap();
  createPluginTypesMap({
    packageName: '@lowdefy/actions-core',
    packageTypes: { actions: ['Link'] },
    typesMap,
    version: '1.0.0',
  });
  expect(typesMap.connectionMetas).toBe(undefined);
});
