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

import list from './list.js';

let configDirectory;
let context;
let logs;

function writeDataSet(name, content) {
  fs.writeFileSync(path.join(configDirectory, 'tests', 'data', `${name}.yaml`), content);
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-list-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
  logs = { info: [], warn: [] };
  context = {
    directories: { config: configDirectory },
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
    },
    sendTelemetry: jest.fn(),
  };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('data list prints the documents and users of each data set', async () => {
  writeDataSet('empty-org', 'users:\n  owner: { id: u_new }\n');
  writeDataSet(
    'sample',
    'fixtures:\n  tickets:\n    - { title: A }\n    - { title: B }\nusers:\n  owner: { id: u_1 }\n  member: { id: u_2 }\n'
  );
  await list({ context });
  expect(logs.info).toEqual(['empty-org: 0 documents, 1 user', 'sample: 2 documents, 2 users']);
  expect(logs.warn).toEqual([]);
  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('data list says how to add a data set when there are none', async () => {
  await list({ context });
  expect(logs.info).toEqual(['No data sets. Add one at tests/data/<name>.yaml.']);
});
