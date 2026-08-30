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

import discoverRequestTests from './discoverRequestTests.js';

let configDirectory;

function writeFile(fileName, content) {
  const directory = path.join(configDirectory, 'tests', 'requests');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, fileName), content);
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-discover-requests-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('discoverRequestTests returns [] when tests/requests does not exist', () => {
  expect(discoverRequestTests({ context: { directories: { config: configDirectory } } })).toEqual(
    []
  );
});

test('discoverRequestTests reads single tests and lists, only from *.test.yaml files, in name order', () => {
  writeFile('b.test.yaml', '- name: two\n- name: three\n');
  writeFile('a.test.yml', 'name: one\n');
  writeFile('ignored.yaml', 'name: ignored\n');
  writeFile('notes.md', 'x');
  const items = discoverRequestTests({ context: { directories: { config: configDirectory } } });
  expect(items.map((item) => item.test.name)).toEqual(['one', 'two', 'three']);
  expect(items[0].filePath).toEqual(path.join(configDirectory, 'tests', 'requests', 'a.test.yml'));
});

test('discoverRequestTests returns an error item for invalid YAML', () => {
  writeFile('bad.test.yaml', 'name: [unclosed\n');
  const items = discoverRequestTests({ context: { directories: { config: configDirectory } } });
  expect(items).toHaveLength(1);
  expect(items[0].test).toBeUndefined();
  expect(items[0].error).toMatch(/^Invalid YAML: /);
});
