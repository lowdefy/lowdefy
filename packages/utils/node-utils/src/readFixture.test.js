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

import readFixture from './readFixture.js';

let configDirectory;

function writeFixture(fileName, content) {
  const filePath = path.join(configDirectory, 'fixtures', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-fixture-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('readFixture returns connections in file order with ~d markers revived to Dates', async () => {
  writeFixture(
    'base.yaml',
    [
      'organizations_connection:',
      '  - _id: org_a',
      '    name: Org A',
      "    created_at: { '~d': '2026-01-01T00:00:00.000Z' }",
      'controls_connection:',
      '  - { _id: c1, title: Access reviews, organization_id: org_a }',
      '  - { _id: c2, title: Vendor reviews, organization_id: org_a }',
      'answers_connection: []',
      '',
    ].join('\n')
  );
  const fixture = await readFixture({ configDirectory, name: 'base' });
  expect(fixture.name).toEqual('base');
  expect(fixture.connections.map((connection) => connection.connectionId)).toEqual([
    'organizations_connection',
    'controls_connection',
    'answers_connection',
  ]);
  const [organizations, controls, answers] = fixture.connections;
  expect(organizations.docs).toHaveLength(1);
  expect(organizations.docs[0]._id).toEqual('org_a');
  expect(organizations.docs[0].created_at).toBeInstanceOf(Date);
  expect(organizations.docs[0].created_at.toISOString()).toEqual('2026-01-01T00:00:00.000Z');
  expect(controls.docs).toEqual([
    { _id: 'c1', title: 'Access reviews', organization_id: 'org_a' },
    { _id: 'c2', title: 'Vendor reviews', organization_id: 'org_a' },
  ]);
  expect(answers.docs).toEqual([]);
});

test('readFixture falls back to a .yml file', async () => {
  writeFixture('org-a.yml', 'users_connection:\n  - _id: u1\n');
  const fixture = await readFixture({ configDirectory, name: 'org-a' });
  expect(fixture.connections).toEqual([
    { connectionId: 'users_connection', docs: [{ _id: 'u1' }] },
  ]);
});

test('readFixture throws the exact not-found message', async () => {
  await expect(readFixture({ configDirectory, name: 'org-a' })).rejects.toThrow(
    'Fixture "org-a" not found. Expected fixtures/org-a.yaml.'
  );
});

test('readFixture throws the exact message when a key is not an array of documents', async () => {
  writeFixture('base.yaml', 'controls_connection:\n  _id: c1\n');
  await expect(readFixture({ configDirectory, name: 'base' })).rejects.toThrow(
    'Fixture "base" key "controls_connection" must be an array of documents. Received {"_id":"c1"}.'
  );
});

test('readFixture throws when a document is not an object', async () => {
  writeFixture('base.yaml', 'controls_connection:\n  - c1\n');
  await expect(readFixture({ configDirectory, name: 'base' })).rejects.toThrow(
    'Fixture "base" key "controls_connection" document 0 must be an object. Received "c1".'
  );
});

test('readFixture throws when the file is not an object keyed by connectionId', async () => {
  writeFixture('list.yaml', '- _id: c1\n');
  await expect(readFixture({ configDirectory, name: 'list' })).rejects.toThrow(
    'Fixture "list" must be an object keyed by connectionId. Received [{"_id":"c1"}].'
  );
  writeFixture('empty.yaml', '');
  await expect(readFixture({ configDirectory, name: 'empty' })).rejects.toThrow(
    'Fixture "empty" must be an object keyed by connectionId. Received null.'
  );
});

test('readFixture throws on invalid YAML', async () => {
  writeFixture('bad.yaml', 'controls_connection: [unclosed\n');
  await expect(readFixture({ configDirectory, name: 'bad' })).rejects.toThrow(
    /^Fixture "bad" is not valid YAML: /
  );
});

test('readFixture rejects names that are not strings or that escape the fixtures directory', async () => {
  await expect(readFixture({ configDirectory, name: undefined })).rejects.toThrow(
    'Fixture name must be a non-empty string. Received undefined.'
  );
  await expect(readFixture({ configDirectory, name: '' })).rejects.toThrow(
    'Fixture name must be a non-empty string. Received "".'
  );
  await expect(readFixture({ configDirectory, name: '../lowdefy' })).rejects.toThrow(
    'Fixture name must be a path below fixtures/, with no "..", leading "/" or empty segment. Received "../lowdefy".'
  );
  await expect(readFixture({ configDirectory, name: 'sub/../../lowdefy' })).rejects.toThrow(
    'Fixture name must be a path below fixtures/, with no "..", leading "/" or empty segment. Received "sub/../../lowdefy".'
  );
  await expect(readFixture({ configDirectory, name: '/etc/passwd' })).rejects.toThrow(
    'Fixture name must be a path below fixtures/, with no "..", leading "/" or empty segment. Received "/etc/passwd".'
  );
  await expect(readFixture({ configDirectory, name: 'sub\\base' })).rejects.toThrow(
    'Fixture name must be a path below fixtures/, with no "..", leading "/" or empty segment. Received "sub\\\\base".'
  );
});

test('readFixture reads a fixture in a subdirectory', async () => {
  writeFixture(path.join('orders', 'base.yaml'), 'orders_connection: []\n');
  const fixture = await readFixture({ configDirectory, name: 'orders/base' });
  expect(fixture).toEqual({
    name: 'orders/base',
    connections: [{ connectionId: 'orders_connection', docs: [] }],
  });
});

test('readFixture names the declared fixtures when one is not found', async () => {
  writeFixture('base.yaml', 'a_connection: []\n');
  writeFixture(path.join('orders', 'seed.yaml'), 'a_connection: []\n');
  await expect(readFixture({ configDirectory, name: 'bse' })).rejects.toThrow(
    'Fixture "bse" not found. Expected fixtures/bse.yaml. Declared fixtures: base, orders/seed.'
  );
});
