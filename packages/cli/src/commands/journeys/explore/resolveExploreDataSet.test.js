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

import resolveExploreDataSet from './resolveExploreDataSet.js';

let configDirectory;

function writeDataSet(name) {
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'data', `${name}.yaml`),
    'fixtures:\n  tickets:\n    - { title: First }\n'
  );
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-data-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('--data names the data set', async () => {
  writeDataSet('staging');
  writeDataSet('empty');
  const { name, dataSet } = await resolveExploreDataSet({ configDirectory, data: 'empty' });
  expect(name).toBe('empty');
  expect(dataSet.fixtures.tickets).toEqual([{ title: 'First' }]);
});

test('without --data, default.yaml wins, else the only data set', async () => {
  writeDataSet('staging');
  expect((await resolveExploreDataSet({ configDirectory, data: null })).name).toBe('staging');
  writeDataSet('default');
  expect((await resolveExploreDataSet({ configDirectory, data: null })).name).toBe('default');
});

test('several data sets and no default is an error that lists them', async () => {
  writeDataSet('staging');
  writeDataSet('empty');
  await expect(resolveExploreDataSet({ configDirectory, data: null })).rejects.toThrow(
    'tests/data declares several data sets (empty, staging) and no default.yaml. Name one with --data <name>.'
  );
});

test('an app with no data sets resolves none', async () => {
  expect(await resolveExploreDataSet({ configDirectory, data: null })).toEqual({
    name: null,
    dataSet: null,
  });
});
