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

import readChartersFile from './readChartersFile.js';

let directory;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-charters-'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

function read(contents) {
  fs.writeFileSync(path.join(directory, 'charters.yaml'), contents);
  return () => readChartersFile({ filePath: 'charters.yaml', cwd: directory });
}

test('readChartersFile reads a list of charters, pages and roles left undefined when not given', () => {
  const charters = read(`
- goal: Try edge input on the invoice form.
  pages: [invoice, invoice]
  roles: [admin_ann]
- goal: '  Try error paths: cancel, delete, incomplete submits.  '
`)();
  expect(charters).toEqual([
    { goal: 'Try edge input on the invoice form.', pages: ['invoice'], roles: ['admin_ann'] },
    {
      goal: 'Try error paths: cancel, delete, incomplete submits.',
      pages: undefined,
      roles: undefined,
    },
  ]);
});

test('readChartersFile reads the path relative to the working directory, or absolute', () => {
  fs.writeFileSync(path.join(directory, 'charters.yaml'), '- goal: Try edge input.\n');
  expect(readChartersFile({ filePath: path.join(directory, 'charters.yaml'), cwd: '/' })).toEqual([
    { goal: 'Try edge input.', pages: undefined, roles: undefined },
  ]);
});

test('readChartersFile refuses a missing file, invalid YAML and an empty list', () => {
  expect(() => readChartersFile({ filePath: 'none.yaml', cwd: directory })).toThrow(
    '--charters file "none.yaml" does not exist.'
  );
  expect(read('- goal: [unclosed')).toThrow('--charters file "charters.yaml" is not valid YAML');
  expect(read('[]')).toThrow(
    '--charters file "charters.yaml" should be a list of charters, each { goal, pages?, roles? }. Received [].'
  );
  expect(read('goal: Try edge input.')).toThrow('should be a list of charters');
});

test('readChartersFile refuses a charter with a missing or empty goal, naming its place in the list', () => {
  expect(read('- goal: Try edge input.\n- pages: [invoice]\n')).toThrow(
    'Charter 2: goal should be a sentence saying what to try. Received undefined.'
  );
  expect(read("- goal: '  '\n")).toThrow(
    'Charter 1: goal should be a sentence saying what to try. Received "  ".'
  );
  expect(read('- Try edge input.\n')).toThrow(
    'Charter 1: should be { goal, pages?, roles? }. Received "Try edge input.".'
  );
});

test('readChartersFile refuses pages or roles that are not lists of strings, and unknown keys', () => {
  expect(read('- goal: Try edge input.\n  pages: invoice\n')).toThrow(
    'Charter 1: pages should be a list of page ids. Received "invoice".'
  );
  expect(read('- goal: Try edge input.\n  roles: []\n')).toThrow(
    'Charter 1: roles should be a list of data set users. Received [].'
  );
  expect(read('- goal: Try edge input.\n  roles: [1]\n')).toThrow(
    'Charter 1: roles should hold strings. Received 1.'
  );
  expect(read('- goal: Try edge input.\n  user: admin\n')).toThrow(
    'Charter 1: has unknown keys user. A charter is { goal, pages?, roles? }.'
  );
});
