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

import listConfigFiles from './listConfigFiles.js';

let directory;

function write(relativePath) {
  const filePath = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'name: x\n');
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-discovery-'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('listConfigFiles returns an empty array when the directory does not exist', () => {
  expect(listConfigFiles({ directory: path.join(directory, 'nope') })).toEqual([]);
});

test('listConfigFiles returns an empty array when the directory holds no matching file', () => {
  write('notes.md');
  expect(listConfigFiles({ directory })).toEqual([]);
});

test('listConfigFiles names a file by its path below the directory, without the extension', () => {
  write('one.yaml');
  write(path.join('nested', 'two.yml'));
  expect(listConfigFiles({ directory }).map((file) => file.name)).toEqual(['nested/two', 'one']);
});

test('listConfigFiles returns the absolute file path of each match', () => {
  write(path.join('nested', 'two.yaml'));
  expect(listConfigFiles({ directory })[0].filePath).toBe(
    path.join(directory, 'nested', 'two.yaml')
  );
});

test('listConfigFiles byte-sorts names across nesting levels', () => {
  write('b.yaml');
  write('Z.yaml');
  write('a.yaml');
  write(path.join('a-dir', 'z.yaml'));
  // Byte order, not locale order: localeCompare would put "Z" between "a" and "b".
  expect(listConfigFiles({ directory }).map((file) => file.name)).toEqual([
    'Z',
    'a',
    'a-dir/z',
    'b',
  ]);
});

test('listConfigFiles skips underscore and dot prefixed directories and files', () => {
  write('kept.yaml');
  write(path.join('_candidates', 'draft.yaml'));
  write(path.join('.hidden', 'secret.yaml'));
  write('_draft.yaml');
  write('.hidden.yaml');
  expect(listConfigFiles({ directory }).map((file) => file.name)).toEqual(['kept']);
});

test('listConfigFiles matches only the given suffixes', () => {
  write('one.test.yaml');
  write('two.test.yml');
  write('three.yaml');
  expect(
    listConfigFiles({ directory, suffixes: ['.test.yaml', '.test.yml'] }).map((file) => file.name)
  ).toEqual(['one', 'two']);
});

test('listConfigFiles reports the file name relative to the directory', () => {
  write(path.join('nested', 'two.yml'));
  expect(listConfigFiles({ directory })[0].fileName).toBe('nested/two.yml');
});
