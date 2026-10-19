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

import rebasePath from './rebasePath.js';

const directory = '/repo/apps/app/.lowdefy/server';
const workspaceRoot = '/repo';

test('rebasePath points a path relative to the workspace root at the same file from directory', () => {
  expect(rebasePath({ directory, filePath: '.pnpm-store', workspaceRoot })).toEqual(
    '../../../../.pnpm-store'
  );
  expect(rebasePath({ directory, filePath: './patches/a.patch', workspaceRoot })).toEqual(
    '../../../../patches/a.patch'
  );
});

test('rebasePath keeps absolute paths', () => {
  expect(rebasePath({ directory, filePath: '/var/cache/pnpm', workspaceRoot })).toEqual(
    '/var/cache/pnpm'
  );
});

test('rebasePath keeps home directory paths, which pnpm expands', () => {
  expect(rebasePath({ directory, filePath: '~/.pnpm-store', workspaceRoot })).toEqual(
    '~/.pnpm-store'
  );
  expect(rebasePath({ directory, filePath: '~', workspaceRoot })).toEqual('~');
});

test('rebasePath keeps paths that start with an environment variable', () => {
  expect(rebasePath({ directory, filePath: '${CI_CACHE}/store', workspaceRoot })).toEqual(
    '${CI_CACHE}/store'
  );
});
