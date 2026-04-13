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

import path from 'path';
import resolvePath from './resolvePath.js';

const basePath = '/test/knowledge-base';

test('resolvePath resolves a simple relative path', () => {
  expect(resolvePath(basePath, 'file.md')).toBe(path.join(basePath, 'file.md'));
});

test('resolvePath resolves a nested relative path', () => {
  expect(resolvePath(basePath, 'principles/principle-01.md')).toBe(
    path.join(basePath, 'principles/principle-01.md')
  );
});

test('resolvePath resolves root path to basePath', () => {
  expect(resolvePath(basePath, '/')).toBe(basePath);
});

test('resolvePath resolves empty string to basePath', () => {
  expect(resolvePath(basePath, '')).toBe(basePath);
});

test('resolvePath resolves null to basePath', () => {
  expect(resolvePath(basePath, null)).toBe(basePath);
});

test('resolvePath resolves undefined to basePath', () => {
  expect(resolvePath(basePath, undefined)).toBe(basePath);
});

test('resolvePath strips leading slashes from path', () => {
  expect(resolvePath(basePath, '/file.md')).toBe(path.join(basePath, 'file.md'));
  expect(resolvePath(basePath, '///file.md')).toBe(path.join(basePath, 'file.md'));
});

test('resolvePath throws on parent directory traversal', () => {
  expect(() => resolvePath(basePath, '../secret.txt')).toThrow(
    'resolves outside the base directory'
  );
});

test('resolvePath throws on nested parent directory traversal', () => {
  expect(() => resolvePath(basePath, 'sub/../../secret.txt')).toThrow(
    'resolves outside the base directory'
  );
});

test('resolvePath throws on deep parent directory traversal', () => {
  expect(() => resolvePath(basePath, '../../../etc/passwd')).toThrow(
    'resolves outside the base directory'
  );
});

test('resolvePath allows valid subdirectory with dot', () => {
  expect(resolvePath(basePath, '.hidden/file.md')).toBe(path.join(basePath, '.hidden/file.md'));
});

test('resolvePath allows current directory reference', () => {
  expect(resolvePath(basePath, './file.md')).toBe(path.join(basePath, 'file.md'));
});
