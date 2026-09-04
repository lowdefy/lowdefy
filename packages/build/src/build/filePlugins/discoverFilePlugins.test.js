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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import discoverFilePlugins from './discoverFilePlugins.js';

let configDirectory;

function writeFixture(relativePath, contents = '') {
  const absolutePath = path.join(configDirectory, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
  return absolutePath;
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-file-plugins-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('discoverFilePlugins returns nothing when there is no plugins directory', () => {
  expect(discoverFilePlugins({ configDirectory })).toEqual({ records: [], errors: [] });
});

test('discoverFilePlugins returns nothing when the plugins directory has no plugin kinds', () => {
  fs.mkdirSync(path.join(configDirectory, 'plugins'));
  expect(discoverFilePlugins({ configDirectory })).toEqual({ records: [], errors: [] });
});

test('discoverFilePlugins builds a block record with a synthetic package identity', () => {
  const file = writeFixture('plugins/blocks/Card.jsx');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(errors).toEqual([]);
  expect(records).toEqual([
    {
      kind: 'blocks',
      typeName: 'Card',
      originalTypeName: 'Card',
      typeClass: 'Block',
      checkSlug: 'block-types',
      package: null,
      packageId: 'file-plugin',
      version: null,
      file,
      relativePath: 'plugins/blocks/Card.jsx',
    },
  ]);
});

test('discoverFilePlugins discovers actions and every operator runtime directory', () => {
  writeFixture('plugins/actions/CopyRow.js');
  writeFixture('plugins/operators/build/_env.js');
  writeFixture('plugins/operators/client/_slug.js');
  writeFixture('plugins/operators/server/_lookup.js');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(errors).toEqual([]);
  expect(records.map((record) => [record.kind, record.typeName])).toEqual([
    ['actions', 'CopyRow'],
    ['operators.build', '_env'],
    ['operators.client', '_slug'],
    ['operators.server', '_lookup'],
  ]);
});

test('discoverFilePlugins fans a shared operator out into the client and server kinds', () => {
  const file = writeFixture('plugins/operators/shared/_titleCase.js');
  const { records } = discoverFilePlugins({ configDirectory });
  expect(records.map((record) => record.kind)).toEqual(['operators.client', 'operators.server']);
  records.forEach((record) => {
    expect(record.typeName).toEqual('_titleCase');
    expect(record.file).toEqual(file);
    expect(record.relativePath).toEqual('plugins/operators/shared/_titleCase.js');
  });
});

test('discoverFilePlugins orders records by directory then by file name', () => {
  writeFixture('plugins/operators/client/_zed.js');
  writeFixture('plugins/operators/client/_alpha.js');
  writeFixture('plugins/blocks/Zebra.jsx');
  writeFixture('plugins/blocks/Apple.jsx');
  writeFixture('plugins/actions/CopyRow.js');
  const { records } = discoverFilePlugins({ configDirectory });
  expect(records.map((record) => record.relativePath)).toEqual([
    'plugins/blocks/Apple.jsx',
    'plugins/blocks/Zebra.jsx',
    'plugins/actions/CopyRow.js',
    'plugins/operators/client/_alpha.js',
    'plugins/operators/client/_zed.js',
  ]);
});

test('discoverFilePlugins errors when an operator file name does not start with an underscore', () => {
  writeFixture('plugins/operators/client/slug.js');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(records).toEqual([]);
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toEqual(
    'Operator file plugin "plugins/operators/client/slug.js" must be named starting with an underscore.'
  );
  expect(errors[0].checkSlug).toEqual('operator-types');
  expect(errors[0].filePath).toEqual('plugins/operators/client/slug.js');
});

test('discoverFilePlugins errors when a block file name is not PascalCase', () => {
  writeFixture('plugins/blocks/card.jsx');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(records).toEqual([]);
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toEqual(
    'Block file plugin "plugins/blocks/card.jsx" must be named in PascalCase.'
  );
  expect(errors[0].checkSlug).toEqual('block-types');
});

test('discoverFilePlugins ignores files whose name is not a single-segment type name', () => {
  writeFixture('plugins/blocks/Card.jsx');
  writeFixture('plugins/blocks/Card.test.jsx');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(errors).toEqual([]);
  expect(records.map((record) => record.relativePath)).toEqual(['plugins/blocks/Card.jsx']);
});

test('discoverFilePlugins reads meta and schema from a block sibling JSON file', () => {
  writeFixture('plugins/blocks/Card.jsx');
  writeFixture(
    'plugins/blocks/Card.json',
    JSON.stringify({
      meta: { category: 'container' },
      schema: { properties: { title: { type: 'string' } } },
    })
  );
  const { records } = discoverFilePlugins({ configDirectory });
  expect(records[0].meta).toEqual({ category: 'container' });
  expect(records[0].schema).toEqual({ properties: { title: { type: 'string' } } });
  expect(records[0].hazards).toBeUndefined();
});

test('discoverFilePlugins reads schema and hazards from an operator sibling JSON file', () => {
  writeFixture('plugins/operators/server/_lookup.js');
  writeFixture(
    'plugins/operators/server/_lookup.json',
    JSON.stringify({ schema: { type: 'object' }, hazards: ['secrets'] })
  );
  const { records } = discoverFilePlugins({ configDirectory });
  expect(records[0].schema).toEqual({ type: 'object' });
  expect(records[0].hazards).toEqual(['secrets']);
  expect(records[0].meta).toBeUndefined();
});

test('discoverFilePlugins errors when a sibling JSON file cannot be parsed', () => {
  writeFixture('plugins/blocks/Card.jsx');
  writeFixture('plugins/blocks/Card.json', '{ not json');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(records).toHaveLength(1);
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toMatch('Could not parse plugins/blocks/Card.json');
  expect(errors[0].filePath).toEqual('plugins/blocks/Card.json');
});

test('discoverFilePlugins reads pluginApiVersion from a sibling JSON file', () => {
  writeFixture('plugins/blocks/Card.jsx');
  writeFixture(
    'plugins/blocks/Card.json',
    JSON.stringify({ meta: { category: 'display' }, pluginApiVersion: 2 })
  );
  const { records } = discoverFilePlugins({ configDirectory });
  expect(records[0].pluginApiVersion).toEqual(2);
});

test('discoverFilePlugins leaves pluginApiVersion undefined when the sibling JSON omits it', () => {
  writeFixture('plugins/blocks/Card.jsx');
  writeFixture('plugins/blocks/Card.json', JSON.stringify({ meta: { category: 'display' } }));
  const { records } = discoverFilePlugins({ configDirectory });
  expect(records[0].pluginApiVersion).toBeUndefined();
});

test('discoverFilePlugins builds a connection record and one record per request file', () => {
  const connectionFile = writeFixture('plugins/connections/MemoryStore/MemoryStore.js');
  const requestFile = writeFixture('plugins/connections/MemoryStore/requests/MemoryGet.js');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(errors).toEqual([]);
  expect(records).toEqual([
    {
      kind: 'connections',
      typeName: 'MemoryStore',
      originalTypeName: 'MemoryStore',
      typeClass: 'Connection',
      checkSlug: 'connection-types',
      package: null,
      packageId: 'file-plugin',
      version: null,
      file: connectionFile,
      relativePath: 'plugins/connections/MemoryStore/MemoryStore.js',
    },
    {
      kind: 'requests',
      typeName: 'MemoryGet',
      originalTypeName: 'MemoryGet',
      typeClass: 'Request',
      checkSlug: 'request-types',
      connectionType: 'MemoryStore',
      package: null,
      packageId: 'file-plugin',
      version: null,
      file: requestFile,
      relativePath: 'plugins/connections/MemoryStore/requests/MemoryGet.js',
    },
  ]);
});

test('discoverFilePlugins reads schema and meta from a request sibling JSON file', () => {
  writeFixture('plugins/connections/MemoryStore/MemoryStore.js');
  writeFixture(
    'plugins/connections/MemoryStore/MemoryStore.json',
    JSON.stringify({ schema: { type: 'object' } })
  );
  writeFixture('plugins/connections/MemoryStore/requests/MemoryGet.js');
  writeFixture(
    'plugins/connections/MemoryStore/requests/MemoryGet.json',
    JSON.stringify({ schema: { type: 'object' }, meta: { checkRead: true, checkWrite: false } })
  );
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(errors).toEqual([]);
  expect(records[0].schema).toEqual({ type: 'object' });
  expect(records[1].schema).toEqual({ type: 'object' });
  expect(records[1].meta).toEqual({ checkRead: true, checkWrite: false });
});

test('discoverFilePlugins carries a connection tenant capability from its sibling JSON', () => {
  writeFixture('plugins/connections/MemoryStore/MemoryStore.js');
  writeFixture(
    'plugins/connections/MemoryStore/MemoryStore.json',
    JSON.stringify({ meta: { tenant: true } })
  );
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(errors).toEqual([]);
  expect(records[0].meta).toEqual({ tenant: true });
});

test('discoverFilePlugins errors when a connection meta declares a non-boolean tenant', () => {
  writeFixture('plugins/connections/MemoryStore/MemoryStore.js');
  writeFixture(
    'plugins/connections/MemoryStore/MemoryStore.json',
    JSON.stringify({ meta: { tenant: 'shared' } })
  );
  const { errors } = discoverFilePlugins({ configDirectory });
  expect(errors.length).toEqual(1);
  expect(errors[0].message).toEqual(
    'Connection file plugin "plugins/connections/MemoryStore/MemoryStore.json": meta.tenant should be true (implements the tenant scoping contract) or false (non-scopable).'
  );
  expect(errors[0].filePath).toEqual('plugins/connections/MemoryStore/MemoryStore.json');
  expect(errors[0].checkSlug).toEqual('connection-types');
});

test('discoverFilePlugins errors when a connection directory has no file named after it', () => {
  writeFixture('plugins/connections/MemoryStore/requests/MemoryGet.js');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(records).toEqual([]);
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toEqual(
    'Connection file plugin "plugins/connections/MemoryStore" has no "MemoryStore.js". A connection directory is named after the connection type it defines.'
  );
  expect(errors[0].filePath).toEqual('plugins/connections/MemoryStore');
  expect(errors[0].checkSlug).toEqual('connection-types');
});

test('discoverFilePlugins errors when a request file name is not PascalCase', () => {
  writeFixture('plugins/connections/MemoryStore/MemoryStore.js');
  writeFixture('plugins/connections/MemoryStore/requests/memoryGet.js');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(records.map((record) => record.kind)).toEqual(['connections']);
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toEqual(
    'Request file plugin "plugins/connections/MemoryStore/requests/memoryGet.js" must be named in PascalCase.'
  );
  expect(errors[0].checkSlug).toEqual('request-types');
});

test('discoverFilePlugins discovers a connection directory with no requests directory', () => {
  writeFixture('plugins/connections/MemoryStore/MemoryStore.js');
  const { records, errors } = discoverFilePlugins({ configDirectory });
  expect(errors).toEqual([]);
  expect(records.map((record) => record.kind)).toEqual(['connections']);
});
