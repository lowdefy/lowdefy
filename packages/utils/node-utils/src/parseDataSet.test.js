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

import fs from 'fs';
import os from 'os';
import path from 'path';

import hashDataSetSpec from './hashDataSetSpec.js';
import parseDataSet from './parseDataSet.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-set-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeDataSet(fileName, content) {
  fs.writeFileSync(path.join(configDirectory, 'tests', 'data', fileName), content);
}

function writeManifest(name, manifest) {
  const directory = path.join(configDirectory, '.lowdefy', 'data', name);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
}

const sample = `
snapshot:
  from: staging
  connections:
    - tickets
    - { id: frameworks, scope: false, limit: 20000 }
    - { id: connections, sort: { created_at: -1 }, omit: [auth.encrypted] }
  scope:
    field: organizationId
    values: [org_b]
  limit: 5000
fixtures:
  tickets:
    - { _id: t-empty-title, organizationId: org_a, title: '', created: { '~d': 1700000000000 } }
    - { ref: { _oid: 64b7f0c2a1b2c3d4e5f60718 } }
indexes:
  tickets:
    - { key: { organizationId: 1, number: 1 }, unique: true }
users:
  owner: { id: u_1, roles: [admin], organizationId: org_a }
`;

test('parseDataSet returns the data set with snapshot null before a pull, with no build present', async () => {
  writeDataSet('staging-sample.yaml', sample);
  const dataSet = await parseDataSet({ configDirectory, name: 'staging-sample' });
  expect(dataSet.name).toEqual('staging-sample');
  expect(dataSet.filePath).toEqual(
    path.join(configDirectory, 'tests', 'data', 'staging-sample.yaml')
  );
  expect(dataSet.snapshot).toBe(null);
  expect(dataSet.fixtures.tickets[0]).toEqual({
    _id: 't-empty-title',
    organizationId: 'org_a',
    title: '',
    created: { '~d': 1700000000000 },
  });
  expect(dataSet.fixtures.tickets[1]).toEqual({ ref: { _oid: '64b7f0c2a1b2c3d4e5f60718' } });
  expect(dataSet.users).toEqual({
    owner: { id: 'u_1', roles: ['admin'], organizationId: 'org_a' },
  });
  expect(dataSet.indexes.tickets).toEqual([
    { key: { organizationId: 1, number: 1 }, unique: true },
  ]);
  expect(dataSet.snapshotSpec.from).toEqual('staging');
  expect(dataSet.specHash).toEqual(hashDataSetSpec({ snapshotSpec: dataSet.snapshotSpec }));
});

test('parseDataSet returns the manifest pulledAt after a pull', async () => {
  writeDataSet('staging-sample.yaml', sample);
  writeManifest('staging-sample', {
    name: 'staging-sample',
    from: 'staging',
    pulledAt: '2026-10-01T00:00:00.000Z',
    specHash: 'abc',
    collections: { tickets: { connections: ['tickets'], count: 3, indexes: [] } },
  });
  const dataSet = await parseDataSet({ configDirectory, name: 'staging-sample' });
  expect(dataSet.snapshot).toEqual({
    pulledAt: '2026-10-01T00:00:00.000Z',
    from: 'staging',
    specHash: 'abc',
    collections: { tickets: { connections: ['tickets'], count: 3, indexes: [] } },
  });
});

test('parseDataSet resolves a .yml file', async () => {
  writeDataSet('empty-org.yml', 'users:\n  owner: { id: u_new }\n');
  const dataSet = await parseDataSet({ configDirectory, name: 'empty-org' });
  expect(dataSet.users).toEqual({ owner: { id: 'u_new' } });
  expect(dataSet.fixtures).toEqual({});
  expect(dataSet.indexes).toEqual({});
  expect(dataSet.snapshotSpec).toBe(null);
  expect(dataSet.specHash).toBe(null);
});

test('parseDataSet refuses a traversal name', async () => {
  await expect(parseDataSet({ configDirectory, name: '../x' })).rejects.toThrow(
    'Data set name "../x" is not valid.'
  );
});

test('parseDataSet refuses a missing data set, listing the declared names', async () => {
  writeDataSet('alpha.yaml', 'users: {}\n');
  writeDataSet('beta.yml', 'users: {}\n');
  await expect(parseDataSet({ configDirectory, name: 'gamma' })).rejects.toThrow(
    'Data set "gamma" not found in tests/data. Declared: alpha, beta.'
  );
});

test('parseDataSet refuses a missing data set when no tests/data directory exists', async () => {
  fs.rmSync(path.join(configDirectory, 'tests'), { recursive: true });
  await expect(parseDataSet({ configDirectory, name: 'gamma' })).rejects.toThrow(
    'No data sets are declared.'
  );
});

test('parseDataSet refuses a name with both a .yaml and a .yml file', async () => {
  writeDataSet('alpha.yaml', 'users: {}\n');
  writeDataSet('alpha.yml', 'users: {}\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow('keep one');
});

test('parseDataSet refuses an unknown top-level key', async () => {
  writeDataSet('alpha.yaml', 'users: {}\nseed: {}\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set tests/data/alpha.yaml: unknown key "seed".'
  );
});

test('parseDataSet refuses a _ref anywhere in the file', async () => {
  writeDataSet('alpha.yaml', 'fixtures:\n  tickets:\n    - { body: { _ref: other.yaml } }\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    '_ref at fixtures.tickets[0].body.'
  );
});

test('parseDataSet refuses an operator key at the top of a fixture document', async () => {
  writeDataSet('alpha.yaml', 'fixtures:\n  tickets:\n    - { _date: now }\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'fixtures.tickets[0] key "_date" looks like an operator'
  );
});

test('parseDataSet refuses fixtures that are not arrays of objects', async () => {
  writeDataSet('alpha.yaml', 'fixtures:\n  tickets: { _id: a }\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'fixtures.tickets should be an array of documents.'
  );
});

test('parseDataSet refuses a snapshot with no connections', async () => {
  writeDataSet('alpha.yaml', 'snapshot:\n  from: staging\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'snapshot.connections should list the connections to copy'
  );
});

test('parseDataSet refuses a snapshot with no from', async () => {
  writeDataSet('alpha.yaml', 'snapshot:\n  connections: [tickets]\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'snapshot.from should name'
  );
});

test('parseDataSet refuses a malformed snapshot connection entry', async () => {
  writeDataSet(
    'alpha.yaml',
    'snapshot:\n  from: staging\n  connections:\n    - { id: a, limit: 0 }\n'
  );
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'snapshot.connections[0].limit should be a whole number above 0. Received 0.'
  );
  writeDataSet(
    'alpha.yaml',
    'snapshot:\n  from: staging\n  connections:\n    - { id: a, filter: {} }\n'
  );
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'snapshot.connections[0] has unknown key "filter".'
  );
  writeDataSet(
    'alpha.yaml',
    'snapshot:\n  from: staging\n  connections:\n    - { id: a, omit: auth }\n'
  );
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'snapshot.connections[0].omit should be a list of field paths.'
  );
});

test('parseDataSet refuses a malformed snapshot scope', async () => {
  writeDataSet(
    'alpha.yaml',
    'snapshot:\n  from: staging\n  connections: [a]\n  scope: { field: organizationId }\n'
  );
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'snapshot.scope should be { field: <field path>, values: [...] }.'
  );
});

test('parseDataSet refuses a users entry that is not an object', async () => {
  writeDataSet('alpha.yaml', 'users:\n  owner: admin\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'users.owner should be an inline user object'
  );
});

test('parseDataSet refuses a user with a password', async () => {
  writeDataSet('alpha.yaml', 'users:\n  owner: { id: u_1, password: secret }\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'users.owner has a "password".'
  );
});

test('parseDataSet refuses a user named none', async () => {
  writeDataSet('alpha.yaml', 'users:\n  none: { id: u_1 }\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'users key "none" is reserved'
  );
});

test('parseDataSet refuses an index with v', async () => {
  writeDataSet('alpha.yaml', 'indexes:\n  tickets:\n    - { key: { a: 1 }, v: 2 }\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'indexes.tickets[0] has "v"'
  );
});

test('parseDataSet refuses an index with no key', async () => {
  writeDataSet('alpha.yaml', 'indexes:\n  tickets:\n    - { unique: true }\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'indexes.tickets[0] should have a "key" object'
  );
});

test('parseDataSet keeps listIndexes options such as text index weights', async () => {
  writeDataSet(
    'alpha.yaml',
    'indexes:\n  tickets:\n    - { key: { _fts: text, _ftsx: 1 }, name: title_text, weights: { title: 1 } }\n'
  );
  const dataSet = await parseDataSet({ configDirectory, name: 'alpha' });
  expect(dataSet.indexes.tickets[0]).toEqual({
    key: { _fts: 'text', _ftsx: 1 },
    name: 'title_text',
    weights: { title: 1 },
  });
});

test('parseDataSet refuses invalid YAML naming the file', async () => {
  writeDataSet('alpha.yaml', 'users: [\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    'Data set tests/data/alpha.yaml: could not parse YAML.'
  );
});

test('parseDataSet treats an empty file as an empty data set', async () => {
  writeDataSet('alpha.yaml', '');
  const dataSet = await parseDataSet({ configDirectory, name: 'alpha' });
  expect(dataSet.fixtures).toEqual({});
  expect(dataSet.users).toEqual({});
});

test('hashDataSetSpec does not depend on key order', () => {
  expect(hashDataSetSpec({ snapshotSpec: { from: 'staging', connections: ['a'] } })).toEqual(
    hashDataSetSpec({ snapshotSpec: { connections: ['a'], from: 'staging' } })
  );
  expect(hashDataSetSpec({ snapshotSpec: { from: 'staging', connections: ['a'] } })).not.toEqual(
    hashDataSetSpec({ snapshotSpec: { from: 'staging', connections: ['b'] } })
  );
});
