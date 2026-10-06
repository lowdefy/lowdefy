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

import listDataSets from './listDataSets.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-sets-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeDataSet(fileName, content) {
  fs.writeFileSync(path.join(configDirectory, 'tests', 'data', fileName), content);
}

test('listDataSets returns an empty list when tests/data does not exist', async () => {
  fs.rmSync(path.join(configDirectory, 'tests'), { recursive: true });
  expect(await listDataSets({ configDirectory })).toEqual([]);
});

test('listDataSets returns each data set with its document and user counts, sorted by name', async () => {
  writeDataSet('empty-org.yaml', 'users:\n  owner: { id: u_new }\n');
  writeDataSet(
    'sample.yml',
    'fixtures:\n  tickets:\n    - { title: A }\n    - { title: B }\n  companies:\n    - { name: C }\nusers:\n  owner: { id: u_1 }\n  member: { id: u_2 }\n'
  );
  writeDataSet('README.md', '# not a data set\n');
  expect(await listDataSets({ configDirectory })).toEqual([
    { name: 'empty-org', documents: 0, users: 1 },
    { name: 'sample', documents: 3, users: 2 },
  ]);
});
