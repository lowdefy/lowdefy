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

const sample = `
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

test('parseDataSet returns fixtures, users and indexes with no build present', async () => {
  writeDataSet('sample.yaml', sample);
  const dataSet = await parseDataSet({ configDirectory, name: 'sample' });
  expect(dataSet.name).toEqual('sample');
  expect(dataSet.filePath).toEqual(path.join(configDirectory, 'tests', 'data', 'sample.yaml'));
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
});

test('parseDataSet resolves a .yml file', async () => {
  writeDataSet('empty-org.yml', 'users:\n  owner: { id: u_new }\n');
  const dataSet = await parseDataSet({ configDirectory, name: 'empty-org' });
  expect(dataSet.users).toEqual({ owner: { id: 'u_new' } });
  expect(dataSet.fixtures).toEqual({});
  expect(dataSet.indexes).toEqual({});
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
    `Data set ${path.join('tests', 'data', 'alpha.yaml')}: unknown key "seed".`
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
    `Data set ${path.join('tests', 'data', 'alpha.yaml')}: could not parse YAML.`
  );
});

test('parseDataSet treats an empty file as an empty data set', async () => {
  writeDataSet('alpha.yaml', '');
  const dataSet = await parseDataSet({ configDirectory, name: 'alpha' });
  expect(dataSet.fixtures).toEqual({});
  expect(dataSet.users).toEqual({});
});

test('parseDataSet refuses a snapshot block, saying snapshots were removed', async () => {
  writeDataSet('alpha.yaml', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  await expect(parseDataSet({ configDirectory, name: 'alpha' })).rejects.toThrow(
    `Data set ${path.join(
      'tests',
      'data',
      'alpha.yaml'
    )}: snapshot is no longer supported: data sets hold committed documents only. Move the documents journeys need into fixtures or generate.`
  );
});
