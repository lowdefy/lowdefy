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

import parseModuleSource from './parseModuleSource.js';

test('parseModuleSource parses file source', () => {
  expect(parseModuleSource('file:../../modules/user-admin')).toEqual({
    type: 'file',
    path: '../../modules/user-admin',
  });
});

test('parseModuleSource parses file source with absolute path', () => {
  expect(parseModuleSource('file:/Users/dev/my-module')).toEqual({
    type: 'file',
    path: '/Users/dev/my-module',
  });
});

test('parseModuleSource parses github source without path', () => {
  expect(parseModuleSource('github:lowdefy/notifications@v1.0.0')).toEqual({
    type: 'github',
    owner: 'lowdefy',
    repo: 'notifications',
    path: null,
    ref: 'v1.0.0',
  });
});

test('parseModuleSource parses github source with subdirectory path', () => {
  expect(parseModuleSource('github:my-org/modules/user-admin@v1.0.0')).toEqual({
    type: 'github',
    owner: 'my-org',
    repo: 'modules',
    path: 'user-admin',
    ref: 'v1.0.0',
  });
});

test('parseModuleSource parses github source with deep subdirectory path', () => {
  expect(parseModuleSource('github:my-org/modules/nested/deep/module@v2.1.0')).toEqual({
    type: 'github',
    owner: 'my-org',
    repo: 'modules',
    path: 'nested/deep/module',
    ref: 'v2.1.0',
  });
});

test('parseModuleSource parses github source with branch ref', () => {
  expect(parseModuleSource('github:my-org/repo@main')).toEqual({
    type: 'github',
    owner: 'my-org',
    repo: 'repo',
    path: null,
    ref: 'main',
  });
});

test('parseModuleSource parses github source with commit SHA ref', () => {
  expect(parseModuleSource('github:my-org/repo@a1b2c3d')).toEqual({
    type: 'github',
    owner: 'my-org',
    repo: 'repo',
    path: null,
    ref: 'a1b2c3d',
  });
});

test('parseModuleSource throws for github source missing @ref', () => {
  expect(() => parseModuleSource('github:my-org/repo')).toThrow(
    'Module source "github:my-org/repo" is missing @ref (e.g., @v1.0.0).'
  );
});

test('parseModuleSource throws for github source missing owner/repo', () => {
  expect(() => parseModuleSource('github:repo-only@v1.0.0')).toThrow(
    'Module source "github:repo-only@v1.0.0" must include owner/repo.'
  );
});

test('parseModuleSource throws for unknown source type', () => {
  expect(() => parseModuleSource('npm:some-package@1.0.0')).toThrow(
    'Unknown module source type: "npm:some-package@1.0.0". Expected "github:" or "file:".'
  );
});

test('parseModuleSource handles @ in ref correctly using lastIndexOf', () => {
  // The ref itself shouldn't contain @, but the path might have unusual names
  expect(parseModuleSource('github:owner/repo@v1.0.0-beta.1')).toEqual({
    type: 'github',
    owner: 'owner',
    repo: 'repo',
    path: null,
    ref: 'v1.0.0-beta.1',
  });
});
