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

import addFilePluginTypes from './addFilePluginTypes.js';

function blockRecord(overrides = {}) {
  return {
    kind: 'blocks',
    typeName: 'Card',
    originalTypeName: 'Card',
    typeClass: 'Block',
    checkSlug: 'block-types',
    package: null,
    packageId: 'file-plugin',
    version: null,
    file: '/app/plugins/blocks/Card.jsx',
    relativePath: 'plugins/blocks/Card.jsx',
    ...overrides,
  };
}

test('addFilePluginTypes writes a record into the typesMap store for its kind', () => {
  const typesMap = { blocks: {} };
  const collisions = addFilePluginTypes({ records: [blockRecord()], typesMap });
  expect(collisions).toEqual([]);
  expect(typesMap.blocks).toEqual({
    Card: {
      package: null,
      packageId: 'file-plugin',
      originalTypeName: 'Card',
      version: null,
      file: '/app/plugins/blocks/Card.jsx',
      relativePath: 'plugins/blocks/Card.jsx',
    },
  });
});

test('addFilePluginTypes creates a store the typesMap does not have yet', () => {
  const typesMap = { operators: { client: {}, server: {} } };
  addFilePluginTypes({
    records: [
      blockRecord({
        kind: 'operators.build',
        typeName: '_env',
        originalTypeName: '_env',
        typeClass: 'Operator',
        checkSlug: 'operator-types',
        file: '/app/plugins/operators/build/_env.js',
        relativePath: 'plugins/operators/build/_env.js',
      }),
    ],
    typesMap,
  });
  expect(Object.keys(typesMap.operators.build)).toEqual(['_env']);
});

test('addFilePluginTypes carries sibling meta, schema and hazards onto the definition', () => {
  const typesMap = { blocks: {} };
  addFilePluginTypes({
    records: [blockRecord({ meta: { category: 'container' }, schema: { type: 'object' } })],
    typesMap,
  });
  expect(typesMap.blocks.Card.meta).toEqual({ category: 'container' });
  expect(typesMap.blocks.Card.schema).toEqual({ type: 'object' });
  expect(typesMap.blocks.Card.hazards).toBeUndefined();
});

test('addFilePluginTypes reports a collision with a package type and keeps the package type', () => {
  const typesMap = {
    blocks: { Card: { package: '@lowdefy/blocks-antd', originalTypeName: 'Card' } },
  };
  const collisions = addFilePluginTypes({ records: [blockRecord()], typesMap });
  expect(collisions).toHaveLength(1);
  expect(collisions[0].message).toEqual(
    'Block type "Card" is defined by plugins/blocks/Card.jsx and by @lowdefy/blocks-antd.'
  );
  expect(collisions[0].checkSlug).toEqual('block-types');
  expect(collisions[0].filePath).toEqual('plugins/blocks/Card.jsx');
  expect(typesMap.blocks.Card.package).toEqual('@lowdefy/blocks-antd');
});

test('addFilePluginTypes reports a collision between two file plugins of the same type name', () => {
  const typesMap = { blocks: {} };
  const collisions = addFilePluginTypes({
    records: [
      blockRecord(),
      blockRecord({ file: '/app/plugins/blocks/Card.js', relativePath: 'plugins/blocks/Card.js' }),
    ],
    typesMap,
  });
  expect(collisions).toHaveLength(1);
  expect(collisions[0].message).toEqual(
    'Block type "Card" is defined by plugins/blocks/Card.js and by plugins/blocks/Card.jsx.'
  );
  expect(typesMap.blocks.Card.relativePath).toEqual('plugins/blocks/Card.jsx');
});

test('addFilePluginTypes reports every collision, not only the first', () => {
  const typesMap = {
    blocks: { Card: { package: '@lowdefy/blocks-antd' } },
    actions: { CopyRow: { package: '@acme/actions' } },
  };
  const collisions = addFilePluginTypes({
    records: [
      blockRecord(),
      blockRecord({
        kind: 'actions',
        typeName: 'CopyRow',
        originalTypeName: 'CopyRow',
        typeClass: 'Action',
        checkSlug: 'action-types',
        file: '/app/plugins/actions/CopyRow.js',
        relativePath: 'plugins/actions/CopyRow.js',
      }),
    ],
    typesMap,
  });
  expect(collisions.map((collision) => collision.message)).toEqual([
    'Block type "Card" is defined by plugins/blocks/Card.jsx and by @lowdefy/blocks-antd.',
    'Action type "CopyRow" is defined by plugins/actions/CopyRow.js and by @acme/actions.',
  ]);
});

test('addFilePluginTypes writes a shared operator into both the client and the server store', () => {
  const typesMap = { operators: { client: {}, server: {} } };
  const shared = {
    typeName: '_titleCase',
    originalTypeName: '_titleCase',
    typeClass: 'Operator',
    checkSlug: 'operator-types',
    file: '/app/plugins/operators/shared/_titleCase.js',
    relativePath: 'plugins/operators/shared/_titleCase.js',
  };
  const collisions = addFilePluginTypes({
    records: [
      blockRecord({ ...shared, kind: 'operators.client' }),
      blockRecord({ ...shared, kind: 'operators.server' }),
    ],
    typesMap,
  });
  expect(collisions).toEqual([]);
  expect(typesMap.operators.client._titleCase.file).toEqual(shared.file);
  expect(typesMap.operators.server._titleCase.file).toEqual(shared.file);
});

test('addFilePluginTypes keeps the connection a request type belongs to on its definition', () => {
  const typesMap = { connections: {}, requests: {} };
  const collisions = addFilePluginTypes({
    records: [
      blockRecord({
        kind: 'connections',
        typeName: 'MemoryStore',
        originalTypeName: 'MemoryStore',
        typeClass: 'Connection',
        checkSlug: 'connection-types',
        file: '/app/plugins/connections/MemoryStore/MemoryStore.js',
        relativePath: 'plugins/connections/MemoryStore/MemoryStore.js',
      }),
      blockRecord({
        kind: 'requests',
        typeName: 'MemoryGet',
        originalTypeName: 'MemoryGet',
        typeClass: 'Request',
        checkSlug: 'request-types',
        connectionType: 'MemoryStore',
        meta: { checkRead: true, checkWrite: false },
        file: '/app/plugins/connections/MemoryStore/requests/MemoryGet.js',
        relativePath: 'plugins/connections/MemoryStore/requests/MemoryGet.js',
      }),
    ],
    typesMap,
  });
  expect(collisions).toEqual([]);
  expect(typesMap.connections.MemoryStore.connectionType).toBeUndefined();
  expect(typesMap.requests.MemoryGet).toEqual({
    package: null,
    packageId: 'file-plugin',
    originalTypeName: 'MemoryGet',
    version: null,
    file: '/app/plugins/connections/MemoryStore/requests/MemoryGet.js',
    relativePath: 'plugins/connections/MemoryStore/requests/MemoryGet.js',
    connectionType: 'MemoryStore',
    meta: { checkRead: true, checkWrite: false },
  });
});

test('addFilePluginTypes writes a connection tenant capability into connectionMetas', () => {
  const typesMap = { connections: {}, requests: {} };
  const collisions = addFilePluginTypes({
    records: [
      blockRecord({
        kind: 'connections',
        typeName: 'MemoryStore',
        originalTypeName: 'MemoryStore',
        typeClass: 'Connection',
        checkSlug: 'connection-types',
        meta: { tenant: true },
        file: '/app/plugins/connections/MemoryStore/MemoryStore.js',
        relativePath: 'plugins/connections/MemoryStore/MemoryStore.js',
      }),
    ],
    typesMap,
  });
  expect(collisions).toEqual([]);
  expect(typesMap.connectionMetas).toEqual({ MemoryStore: { tenant: true } });
});

test('addFilePluginTypes does not write connectionMetas for a connection with no meta', () => {
  const typesMap = { connections: {}, requests: {}, connectionMetas: {} };
  addFilePluginTypes({
    records: [
      blockRecord({
        kind: 'connections',
        typeName: 'MemoryStore',
        originalTypeName: 'MemoryStore',
        typeClass: 'Connection',
        checkSlug: 'connection-types',
        file: '/app/plugins/connections/MemoryStore/MemoryStore.js',
        relativePath: 'plugins/connections/MemoryStore/MemoryStore.js',
      }),
    ],
    typesMap,
  });
  expect(typesMap.connectionMetas).toEqual({});
});

test('addFilePluginTypes keeps the package connectionMetas when a connection type collides', () => {
  const typesMap = {
    connections: { MemoryStore: { package: '@lowdefy/connection-memory' } },
    requests: {},
    connectionMetas: { MemoryStore: { tenant: false } },
  };
  const collisions = addFilePluginTypes({
    records: [
      blockRecord({
        kind: 'connections',
        typeName: 'MemoryStore',
        originalTypeName: 'MemoryStore',
        typeClass: 'Connection',
        checkSlug: 'connection-types',
        meta: { tenant: true },
        file: '/app/plugins/connections/MemoryStore/MemoryStore.js',
        relativePath: 'plugins/connections/MemoryStore/MemoryStore.js',
      }),
    ],
    typesMap,
  });
  expect(collisions.length).toEqual(1);
  expect(typesMap.connectionMetas).toEqual({ MemoryStore: { tenant: false } });
});
