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

import writeConnectionSchemaMap from './writeConnectionSchemaMap.js';

const mockWriteBuildArtifact = jest.fn();

function makeContext({ connections = {}, requests = {}, schemas, installedPackages } = {}) {
  const packages = new Set(
    [...Object.values(connections), ...Object.values(requests)].map(
      (definition) => definition.package
    )
  );
  return {
    typesMap: { connections, requests, ...(schemas && { schemas }) },
    installedPackages: installedPackages ?? packages,
    writeBuildArtifact: mockWriteBuildArtifact,
  };
}

function writtenArtifacts() {
  const artifacts = {};
  for (const [name, json] of mockWriteBuildArtifact.mock.calls) {
    artifacts[name] = JSON.parse(json);
  }
  return artifacts;
}

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeConnectionSchemaMap writes empty maps when no connections or requests', async () => {
  await writeConnectionSchemaMap({ context: makeContext() });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/connectionSchemas.json', '{}');
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/requestSchemas.json', '{}');
});

test('writeConnectionSchemaMap collects connection and request schemas from resolvable packages', async () => {
  const context = makeContext({
    connections: {
      AxiosHttp: {
        package: '@lowdefy/connection-axios-http',
        originalTypeName: 'AxiosHttp',
        version: '5.0.0',
      },
    },
    requests: {
      AxiosHttp: {
        package: '@lowdefy/connection-axios-http',
        originalTypeName: 'AxiosHttp',
        version: '5.0.0',
      },
    },
  });
  await writeConnectionSchemaMap({ context });
  const artifacts = writtenArtifacts();
  const connection = artifacts['plugins/connectionSchemas.json'].AxiosHttp;
  expect(connection.schema).toBeDefined();
  expect(connection.requests).toEqual(['AxiosHttp']);
  const request = artifacts['plugins/requestSchemas.json'].AxiosHttp;
  expect(request.schema).toBeDefined();
  expect(request.meta).toBeDefined();
});

test('writeConnectionSchemaMap prefixes request names with connection typePrefix', async () => {
  const context = makeContext({
    connections: {
      CustomAxiosHttp: {
        package: '@lowdefy/connection-axios-http',
        originalTypeName: 'AxiosHttp',
        version: '5.0.0',
      },
    },
    requests: {
      CustomAxiosHttp: {
        package: '@lowdefy/connection-axios-http',
        originalTypeName: 'AxiosHttp',
        version: '5.0.0',
      },
    },
  });
  await writeConnectionSchemaMap({ context });
  const artifacts = writtenArtifacts();
  expect(artifacts['plugins/connectionSchemas.json'].CustomAxiosHttp.requests).toEqual([
    'CustomAxiosHttp',
  ]);
  expect(artifacts['plugins/requestSchemas.json'].CustomAxiosHttp.schema).toBeDefined();
});

test('writeConnectionSchemaMap skips unresolvable packages gracefully', async () => {
  const context = makeContext({
    connections: {
      FakeConnection: {
        package: 'non-existent-package',
        originalTypeName: 'FakeConnection',
        version: '1.0.0',
      },
    },
    requests: {
      FakeRequest: {
        package: 'non-existent-package',
        originalTypeName: 'FakeRequest',
        version: '1.0.0',
      },
    },
  });
  await writeConnectionSchemaMap({ context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/connectionSchemas.json', '{}');
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/requestSchemas.json', '{}');
});

test('writeConnectionSchemaMap uses typesMap schemas fallback for custom plugins', async () => {
  const customConnectionSchema = { schema: { type: 'object' } };
  const customRequestSchema = { schema: { type: 'object' } };
  const context = makeContext({
    connections: {
      CustomConnection: {
        package: 'custom-plugin',
        originalTypeName: 'CustomConnection',
        version: '1.0.0',
      },
    },
    requests: {
      CustomRequest: {
        package: 'custom-plugin',
        originalTypeName: 'CustomRequest',
        version: '1.0.0',
      },
    },
    schemas: {
      connections: { CustomConnection: customConnectionSchema },
      requests: { CustomRequest: customRequestSchema },
    },
  });
  await writeConnectionSchemaMap({ context });
  const artifacts = writtenArtifacts();
  expect(artifacts['plugins/connectionSchemas.json'].CustomConnection).toEqual(
    customConnectionSchema
  );
  expect(artifacts['plugins/requestSchemas.json'].CustomRequest).toEqual(customRequestSchema);
});

test('writeConnectionSchemaMap filters to installed packages', async () => {
  const context = makeContext({
    connections: {
      AxiosHttp: {
        package: '@lowdefy/connection-axios-http',
        originalTypeName: 'AxiosHttp',
        version: '5.0.0',
      },
    },
    installedPackages: new Set(['some-other-package']),
  });
  await writeConnectionSchemaMap({ context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('plugins/connectionSchemas.json', '{}');
});

test('writeConnectionSchemaMap skips writing when installedPackages is not set (production build)', async () => {
  const context = {
    typesMap: { connections: {}, requests: {} },
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeConnectionSchemaMap({ context });
  expect(mockWriteBuildArtifact).not.toHaveBeenCalled();
});

test('writeConnectionSchemaMap reads a file plugin connection and its requests from the typesMap', async () => {
  const context = makeContext({
    connections: {
      MemoryStore: {
        package: null,
        packageId: 'file-plugin',
        originalTypeName: 'MemoryStore',
        relativePath: 'plugins/connections/MemoryStore/MemoryStore.js',
        schema: { type: 'object' },
      },
    },
    requests: {
      MemoryGet: {
        package: null,
        packageId: 'file-plugin',
        originalTypeName: 'MemoryGet',
        connectionType: 'MemoryStore',
        relativePath: 'plugins/connections/MemoryStore/requests/MemoryGet.js',
        schema: { type: 'object' },
        meta: { checkRead: true, checkWrite: false },
      },
    },
    installedPackages: new Set(),
  });
  await writeConnectionSchemaMap({ context });
  const artifacts = writtenArtifacts();
  expect(artifacts['plugins/connectionSchemas.json'].MemoryStore).toEqual({
    schema: { type: 'object' },
    requests: ['MemoryGet'],
  });
  expect(artifacts['plugins/requestSchemas.json'].MemoryGet).toEqual({
    schema: { type: 'object' },
    meta: { checkRead: true, checkWrite: false },
  });
});

test('writeConnectionSchemaMap gates a file plugin request that declares no meta on both', async () => {
  const context = makeContext({
    requests: {
      MemoryGet: {
        package: null,
        packageId: 'file-plugin',
        originalTypeName: 'MemoryGet',
        connectionType: 'MemoryStore',
        relativePath: 'plugins/connections/MemoryStore/requests/MemoryGet.js',
      },
    },
    installedPackages: new Set(),
  });
  await writeConnectionSchemaMap({ context });
  expect(writtenArtifacts()['plugins/requestSchemas.json'].MemoryGet).toEqual({
    schema: {},
    meta: { checkRead: true, checkWrite: true },
  });
});
