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
import { afterEach, beforeEach, expect, test } from 'vitest';

import resolveFile from './resolveFile.mjs';

let dir;

function write(relative) {
  const filePath = path.join(dir, relative);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, '');
}

beforeEach(() => {
  dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-resolve-file-test-')));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

test('resolveFile returns the file a full path names', () => {
  write('Api.js');

  expect(resolveFile(path.join(dir, 'Api.js'))).toBe(path.join(dir, 'Api.js'));
});

test('resolveFile adds an extension or an index file', () => {
  write('request.mjs');
  write('Api/index.ts');

  expect(resolveFile(path.join(dir, 'request'))).toBe(path.join(dir, 'request.mjs'));
  expect(resolveFile(path.join(dir, 'Api'))).toBe(path.join(dir, 'Api', 'index.ts'));
});

test('resolveFile resolves a TypeScript output name to its source', () => {
  write('find.ts');
  write('Card.tsx');

  expect(resolveFile(path.join(dir, 'find.js'))).toBe(path.join(dir, 'find.ts'));
  expect(resolveFile(path.join(dir, 'Card.jsx'))).toBe(path.join(dir, 'Card.tsx'));
});

test('resolveFile returns null when no file matches', () => {
  fs.mkdirSync(path.join(dir, 'empty'));

  expect(resolveFile(path.join(dir, 'missing.js'))).toBe(null);
  expect(resolveFile(path.join(dir, 'empty'))).toBe(null);
});
