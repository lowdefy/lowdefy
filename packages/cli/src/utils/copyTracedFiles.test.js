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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

import copyTracedFiles from './copyTracedFiles.js';
import createSkipPlainMapsFilter from './createSkipPlainMapsFilter.js';

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-copy-traced-files-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function listFiles(directory) {
  return fs
    .readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(directory, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
    )
    .sort();
}

// Like the server's apiContext, the entry names its build folder from the cwd, so nft traces
// every file in it.
test('copyTracedFiles leaves out the traced files the filter rejects', async () => {
  const serverDirectory = path.join(root, 'server');
  const files = {
    'src/index.js': [
      "import fs from 'fs';",
      "import path from 'path';",
      "export const buildDirectory = path.join(process.cwd(), 'build');",
      'export const files = fs.readdirSync(buildDirectory);',
      '',
    ].join('\n'),
    'package.json': '{ "type": "module" }',
    'build/config.json': '{}',
    'build/keyMap.json': '{}',
    'build/keyMap.json.gz': 'gzipped',
    'build/refMap.json': '{}',
    'build/refMap.json.gz': 'gzipped',
  };
  Object.entries(files).forEach(([file, content]) => {
    fs.mkdirSync(path.dirname(path.join(serverDirectory, file)), { recursive: true });
    fs.writeFileSync(path.join(serverDirectory, file), content);
  });
  const functionDirectory = path.join(root, 'output');
  await copyTracedFiles({
    base: serverDirectory,
    entrypoints: [path.join(serverDirectory, 'src', 'index.js')],
    filter: createSkipPlainMapsFilter({ buildDirectory: path.join(serverDirectory, 'build') }),
    functionDirectory,
    logger: { debug: vi.fn() },
    processCwd: serverDirectory,
  });
  const copied = listFiles(functionDirectory);
  expect(copied).toEqual(
    expect.arrayContaining(['build/config.json', 'build/keyMap.json.gz', 'build/refMap.json.gz'])
  );
  expect(copied).not.toContain('build/keyMap.json');
  expect(copied).not.toContain('build/refMap.json');
});
