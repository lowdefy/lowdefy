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
import { afterEach, beforeEach, expect, test } from 'vitest';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-set-extends-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeDataSet(fileName, content) {
  fs.writeFileSync(path.join(configDirectory, 'tests', 'data', fileName), content);
}

const base = `
fixtures:
  organizations:
    - { _id: org_a, name: Acme }
  controls:
    - { _id: c1, title: Access }
    - { title: no id }
indexes:
  organizations:
    - { key: { name: 1 } }
users:
  owner: { id: u_1, roles: [admin], organizationId: org_a }
  member: { id: u_2, roles: [member], organizationId: org_a }
generate:
  seed: 1
  tickets:
    count: 5
`;

test('parseDataSet loads an extended data set first, then the file', async () => {
  writeDataSet('base.yaml', base);
  writeDataSet(
    'two-orgs.yaml',
    `
extends: [base]
fixtures:
  organizations:
    - { _id: org_b, name: Beta }
indexes:
  organizations:
    - { key: { slug: 1 }, unique: true }
users:
  outsider: { id: u_9, roles: [admin], organizationId: org_b }
`
  );
  const dataSet = await parseDataSet({ configDirectory, name: 'two-orgs' });
  expect(dataSet.name).toEqual('two-orgs');
  expect(dataSet.filePath).toEqual(path.join(configDirectory, 'tests', 'data', 'two-orgs.yaml'));
  expect(dataSet.fixtures).toEqual({
    organizations: [
      { _id: 'org_a', name: 'Acme' },
      { _id: 'org_b', name: 'Beta' },
    ],
    controls: [{ _id: 'c1', title: 'Access' }, { title: 'no id' }],
  });
  expect(dataSet.indexes).toEqual({
    organizations: [{ key: { name: 1 } }, { key: { slug: 1 }, unique: true }],
  });
  expect(Object.keys(dataSet.users)).toEqual(['owner', 'member', 'outsider']);
});

test('parseDataSet does not run an extended data set generate', async () => {
  writeDataSet('base.yaml', base);
  writeDataSet('empty-org.yaml', 'extends: [base]\n');
  const dataSet = await parseDataSet({ configDirectory, name: 'empty-org' });
  expect(dataSet.generated).toEqual({});
  const baseDataSet = await parseDataSet({ configDirectory, name: 'base' });
  expect(baseDataSet.generated.tickets).toHaveLength(5);
});

test('parseDataSet lets the extending file replace a user and keeps fixture order for _id replacement', async () => {
  writeDataSet('base.yaml', base);
  writeDataSet(
    'renamed.yaml',
    `
extends: [base]
fixtures:
  organizations:
    - { _id: org_a, name: Acme Renamed }
users:
  member: { id: u_3, roles: [viewer], organizationId: org_a }
`
  );
  const dataSet = await parseDataSet({ configDirectory, name: 'renamed' });
  expect(dataSet.fixtures.organizations).toEqual([
    { _id: 'org_a', name: 'Acme' },
    { _id: 'org_a', name: 'Acme Renamed' },
  ]);
  expect(dataSet.users.member).toEqual({ id: 'u_3', roles: ['viewer'], organizationId: 'org_a' });
  expect(dataSet.users.owner).toEqual({ id: 'u_1', roles: ['admin'], organizationId: 'org_a' });
});

test('parseDataSet loads extended data sets in the order extends lists them, recursively', async () => {
  writeDataSet('content.yaml', 'fixtures:\n  controls:\n    - { _id: c1 }\n');
  writeDataSet('tenant-a.yaml', 'extends: [content]\nfixtures:\n  controls:\n    - { _id: a1 }\n');
  writeDataSet('tenant-b.yaml', 'extends: [content]\nfixtures:\n  controls:\n    - { _id: b1 }\n');
  writeDataSet(
    'both.yaml',
    'extends: [tenant-b, tenant-a]\nfixtures:\n  controls:\n    - { _id: x1 }\n'
  );
  const dataSet = await parseDataSet({ configDirectory, name: 'both' });
  expect(dataSet.fixtures.controls.map((document) => document._id)).toEqual([
    'c1',
    'b1',
    'a1',
    'x1',
  ]);
});

test('parseDataSet lets generate ref and check _ids against extended fixtures', async () => {
  writeDataSet('base.yaml', 'fixtures:\n  organizations:\n    - { _id: org_a }\n');
  writeDataSet(
    'tickets.yaml',
    `
extends: [base]
generate:
  seed: 3
  tickets:
    count: 2
    fields:
      organizationId: { ref: organizations }
`
  );
  const dataSet = await parseDataSet({ configDirectory, name: 'tickets' });
  expect(dataSet.generated.tickets.map((document) => document.organizationId)).toEqual([
    'org_a',
    'org_a',
  ]);

  writeDataSet(
    'clash.yaml',
    `
extends: [base]
generate:
  seed: 3
  organizations:
    count: 1
    fields:
      _id: org_a
`
  );
  await expect(parseDataSet({ configDirectory, name: 'clash' })).rejects.toThrow(
    'Data set tests/data/clash.yaml:'
  );
});

test('parseDataSet refuses a cycle', async () => {
  writeDataSet('a.yaml', 'extends: [b]\n');
  writeDataSet('b.yaml', 'extends: [a]\n');
  await expect(parseDataSet({ configDirectory, name: 'a' })).rejects.toThrow(
    'Data set tests/data/b.yaml: extends "a", which makes a cycle: a -> b -> a.'
  );
});

test('parseDataSet refuses a data set that extends itself', async () => {
  writeDataSet('a.yaml', 'extends: [a]\n');
  await expect(parseDataSet({ configDirectory, name: 'a' })).rejects.toThrow(
    'Data set tests/data/a.yaml: extends "a", which makes a cycle: a -> a.'
  );
});

test('parseDataSet refuses an extended data set that is not declared', async () => {
  writeDataSet('base.yaml', base);
  writeDataSet('a.yaml', 'extends: [bse]\n');
  await expect(parseDataSet({ configDirectory, name: 'a' })).rejects.toThrow(
    'Data set tests/data/a.yaml: extends "bse", which is not in tests/data. Declared: a, base.'
  );
});

test('parseDataSet refuses extends that is not a list of names', async () => {
  writeDataSet('a.yaml', 'extends: base\n');
  await expect(parseDataSet({ configDirectory, name: 'a' })).rejects.toThrow(
    'Data set tests/data/a.yaml: "extends" should be a list of data set names, e.g. extends: [base]. Received "base".'
  );
  writeDataSet('b.yaml', 'extends: [../base]\n');
  await expect(parseDataSet({ configDirectory, name: 'b' })).rejects.toThrow(
    'Data set tests/data/b.yaml: extends[0] "../base" is not a data set name.'
  );
  writeDataSet('c.yaml', 'extends: [a, a]\n');
  await expect(parseDataSet({ configDirectory, name: 'c' })).rejects.toThrow(
    'Data set tests/data/c.yaml: extends names "a" twice.'
  );
});

test('parseDataSet names the extended file when it is invalid', async () => {
  writeDataSet('base.yaml', 'fixtures: { _ref: x.yaml }\n');
  writeDataSet('a.yaml', 'extends: [base]\n');
  await expect(parseDataSet({ configDirectory, name: 'a' })).rejects.toThrow(
    'Data set tests/data/base.yaml: _ref at fixtures.'
  );
});
