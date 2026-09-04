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

import writeConnectionImports from './writeConnectionImports.js';

const mockWriteBuildArtifact = jest.fn();

const connectionRecord = {
  kind: 'connections',
  typeName: 'MemoryStore',
  file: '/app/plugins/connections/MemoryStore/MemoryStore.js',
  relativePath: 'plugins/connections/MemoryStore/MemoryStore.js',
};

const requestRecord = {
  kind: 'requests',
  typeName: 'MemoryGet',
  connectionType: 'MemoryStore',
  meta: { checkRead: true, checkWrite: false },
  schema: { type: 'object' },
  file: '/app/plugins/connections/MemoryStore/requests/MemoryGet.js',
  relativePath: 'plugins/connections/MemoryStore/requests/MemoryGet.js',
};

function makeContext({ filePlugins = [] } = {}) {
  return {
    directories: { build: '/app/.lowdefy', config: '/app', server: '/app/.lowdefy/server' },
    filePlugins,
    handleWarning: jest.fn(),
    stage: 'dev',
    writeBuildArtifact: mockWriteBuildArtifact,
  };
}

function writtenBarrel() {
  return mockWriteBuildArtifact.mock.calls[0][1];
}

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeConnectionImports writes a package connection barrel', async () => {
  await writeConnectionImports({
    components: {
      imports: {
        connections: [
          {
            typeName: 'MongoDBCollection',
            originalTypeName: 'MongoDBCollection',
            package: '@lowdefy/connection-mongodb',
          },
        ],
      },
    },
    context: makeContext(),
  });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith(
    'plugins/connections.js',
    "import { MongoDBCollection as MongoDBCollection } from '@lowdefy/connection-mongodb/connections';\nexport default {\n  MongoDBCollection,\n  };"
  );
});

test('writeConnectionImports writes an empty barrel when the app has no connections', async () => {
  await writeConnectionImports({
    components: { imports: { connections: [] } },
    context: makeContext(),
  });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith(
    'plugins/connections.js',
    'export default {\n  };'
  );
});

test('writeConnectionImports assembles a file plugin connection from its request files', async () => {
  const context = makeContext({ filePlugins: [connectionRecord, requestRecord] });
  await writeConnectionImports({
    components: {
      imports: {
        connections: [{ typeName: 'MemoryStore', originalTypeName: 'MemoryStore', package: null }],
      },
    },
    context,
  });
  const barrel = writtenBarrel();
  expect(barrel).toContain(
    "import MemoryStore from '../../plugins/connections/MemoryStore/MemoryStore.js';"
  );
  expect(barrel).toContain(
    "import MemoryStore_MemoryGet from '../../plugins/connections/MemoryStore/requests/MemoryGet.js';"
  );
  expect(barrel).toContain('function filePluginRequest(request, declared) {');
  expect(barrel).toContain(
    'MemoryStore: filePluginConnection(MemoryStore, {}, { MemoryGet: filePluginRequest(MemoryStore_MemoryGet, {"meta":{"checkRead":true,"checkWrite":false},"schema":{"type":"object"}}) }),'
  );
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('writeConnectionImports imports a file plugin connection from the server copy for prod', async () => {
  const context = makeContext({ filePlugins: [connectionRecord, requestRecord] });
  context.stage = 'prod';
  await writeConnectionImports({
    components: {
      imports: {
        connections: [{ typeName: 'MemoryStore', originalTypeName: 'MemoryStore', package: null }],
      },
    },
    context,
  });
  expect(writtenBarrel()).toContain(
    "import MemoryStore from '../server/plugins/connections/MemoryStore/MemoryStore.js';"
  );
});

test('writeConnectionImports stamps the connection schema its sibling JSON declares', async () => {
  const context = makeContext({
    filePlugins: [{ ...connectionRecord, schema: { type: 'object' } }, requestRecord],
  });
  await writeConnectionImports({
    components: {
      imports: {
        connections: [{ typeName: 'MemoryStore', originalTypeName: 'MemoryStore', package: null }],
      },
    },
    context,
  });
  expect(writtenBarrel()).toContain(
    'filePluginConnection(MemoryStore, {"schema":{"type":"object"}},'
  );
});

test('writeConnectionImports warns when a request file plugin declares no connection gates', async () => {
  const context = makeContext({
    filePlugins: [connectionRecord, { ...requestRecord, meta: { checkRead: true } }],
  });
  await writeConnectionImports({
    components: {
      imports: {
        connections: [{ typeName: 'MemoryStore', originalTypeName: 'MemoryStore', package: null }],
      },
    },
    context,
  });
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning.message).toEqual(
    'Request file plugin "plugins/connections/MemoryStore/requests/MemoryGet.js" does not declare its connection gates, so both are enforced. Declare them in "plugins/connections/MemoryStore/requests/MemoryGet.json" as { "meta": { "checkRead": true, "checkWrite": false } }.'
  );
  expect(warning.checkSlug).toEqual('request-types');
});

test('writeConnectionImports throws when a connection has no package and no discovered file', async () => {
  await expect(
    writeConnectionImports({
      components: {
        imports: {
          connections: [
            { typeName: 'MemoryStore', originalTypeName: 'MemoryStore', package: null },
          ],
        },
      },
      context: makeContext(),
    })
  ).rejects.toThrow('No file plugin was discovered for connections type "MemoryStore".');
});
