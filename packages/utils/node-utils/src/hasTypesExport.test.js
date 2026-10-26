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

import { afterEach, beforeEach, expect, test } from 'vitest';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import hasTypesExport from './hasTypesExport.js';

let directory;
let require;

function writePackage({ name, exports }) {
  const packageDirectory = path.join(directory, 'node_modules', name);
  fs.mkdirSync(packageDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(packageDirectory, 'package.json'),
    JSON.stringify({ name, version: '1.0.3', exports })
  );
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-has-types-export-'));
  require = createRequire(path.join(directory, 'package.json'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('hasTypesExport is true for a package that exports ./types', () => {
  writePackage({
    name: '@example/lowdefy-printer',
    exports: { './shell': './shell.cjs', './types': './types.js' },
  });
  expect(hasTypesExport({ name: '@example/lowdefy-printer', require })).toBe(true);
});

test('hasTypesExport is false for a native-only package that exports ./shell alone', () => {
  writePackage({ name: '@example/lowdefy-mdm', exports: { './shell': './shell.cjs' } });
  expect(hasTypesExport({ name: '@example/lowdefy-mdm', require })).toBe(false);
});

test('hasTypesExport is false for a package without exports', () => {
  writePackage({ name: '@example/lowdefy-mdm' });
  expect(hasTypesExport({ name: '@example/lowdefy-mdm', require })).toBe(false);
});

test('hasTypesExport throws, naming the plugin, when the package is not installed', () => {
  expect(() => hasTypesExport({ name: '@example/lowdefy-missing', require })).toThrow(
    'Plugin "@example/lowdefy-missing" is not installed.'
  );
});
