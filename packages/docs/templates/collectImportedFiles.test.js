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

import collectImportedFiles from '@lowdefy/docs-content/scripts/collectImportedFiles.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

let root;
let configDirectory;

function write(file, content) {
  const filePath = path.join(root, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'collect-imported-files-'));
  configDirectory = path.join(root, 'docs');
  fs.mkdirSync(configDirectory);
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('collectImportedFiles follows relative imports through JS files', () => {
  write(
    'plugin/src/blocks/Grid/meta.js',
    "import createMeta from '../../createMeta.js';\nexport default createMeta('Grid');\n"
  );
  write(
    'plugin/src/createMeta.js',
    "import {\n  columns,\n} from './columns.js';\nexport * from './shared.js';\nimport schema from './schema.json' with { type: 'json' };\n"
  );
  write('plugin/src/columns.js', 'export const columns = {};\n');
  write('plugin/src/shared.js', 'export const shared = {};\n');
  write('plugin/src/schema.json', '{}\n');
  expect(
    collectImportedFiles({
      configDirectory,
      files: ['../plugin/src/blocks/Grid/meta.js', 'blocks/Grid.yaml'],
    }).sort()
  ).toEqual([
    '../plugin/src/columns.js',
    '../plugin/src/createMeta.js',
    '../plugin/src/schema.json',
    '../plugin/src/shared.js',
  ]);
});

test('collectImportedFiles follows side-effect and dynamic imports', () => {
  write('docs/entry.js', "import './setup.js';\nconst load = () => import('./lazy.js');\n");
  write('docs/setup.js', '');
  write('docs/lazy.js', '');
  expect(collectImportedFiles({ configDirectory, files: ['entry.js'] }).sort()).toEqual([
    'lazy.js',
    'setup.js',
  ]);
});

test('collectImportedFiles skips package imports, package.json and missing files', () => {
  write(
    'docs/meta.js',
    "import { type } from '@lowdefy/helpers';\nimport pkg from '../package.json' with { type: 'json' };\nimport gone from './gone.js';\n"
  );
  write('package.json', '{}\n');
  expect(collectImportedFiles({ configDirectory, files: ['meta.js'] })).toEqual([]);
});

test('collectImportedFiles reads only JS files and stops on import cycles', () => {
  write('docs/a.js', "import './b.js';\n");
  write('docs/b.js', "import './a.js';\n");
  write('docs/page.yaml', "from './c.js'\n");
  write('docs/c.js', '');
  expect(collectImportedFiles({ configDirectory, files: ['a.js', 'page.yaml'] })).toEqual(['b.js']);
});
