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
import fs from 'fs';
import os from 'os';
import path from 'path';

import hashDataSetSpec from './hashDataSetSpec.js';
import listDataSets from './listDataSets.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-sets-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-03T12:00:00.000Z'));
});

afterEach(() => {
  jest.restoreAllMocks();
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

test('listDataSets returns an empty list when tests/data does not exist', async () => {
  fs.rmSync(path.join(configDirectory, 'tests'), { recursive: true });
  expect(await listDataSets({ configDirectory })).toEqual([]);
});

test('listDataSets returns fixtures-only and snapshot sets with age, documents and spec match, sorted by name', async () => {
  writeDataSet('empty-org.yaml', 'users:\n  owner: { id: u_new }\n');
  writeDataSet(
    'staging-sample.yml',
    'snapshot:\n  from: staging\n  connections: [tickets, companies]\n'
  );
  writeDataSet('changed.yaml', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  writeDataSet('unpulled.yaml', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  writeDataSet('README.md', '# not a data set\n');
  writeManifest('staging-sample', {
    pulledAt: '2026-09-30T08:00:00.000Z',
    specHash: hashDataSetSpec({
      snapshotSpec: { from: 'staging', connections: ['tickets', 'companies'] },
    }),
    collections: {
      tickets: { connections: ['tickets'], count: 1200, indexes: [] },
      companies: { connections: ['companies'], count: 34, indexes: [] },
    },
  });
  writeManifest('changed', {
    pulledAt: '2026-10-03T11:00:00.000Z',
    specHash: 'old',
    collections: { tickets: { connections: ['tickets'], count: 5, indexes: [] } },
  });
  expect(await listDataSets({ configDirectory })).toEqual([
    {
      name: 'changed',
      kind: 'snapshot',
      from: 'staging',
      pulledAt: '2026-10-03T11:00:00.000Z',
      ageDays: 0,
      documents: 5,
      specMatches: false,
    },
    { name: 'empty-org', kind: 'fixtures' },
    {
      name: 'staging-sample',
      kind: 'snapshot',
      from: 'staging',
      pulledAt: '2026-09-30T08:00:00.000Z',
      ageDays: 3,
      documents: 1234,
      specMatches: true,
    },
    { name: 'unpulled', kind: 'snapshot', from: 'staging' },
  ]);
});
