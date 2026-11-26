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

import { expect, test } from 'vitest';

import readCommandDirectories from './readCommandDirectories.js';

const directories = { config: '/app', server: '/app/dist/server' };

test('readCommandDirectories names the server directory when --server-directory was typed', () => {
  const context = { directories, options: { typedOptions: ['serverDirectory'] } };
  expect(readCommandDirectories({ context })).toEqual({
    configDirectory: '/app',
    serverDirectory: '/app/dist/server',
  });
});

test('readCommandDirectories leaves out a server directory the run did not type', () => {
  const context = { directories, options: { serverDirectory: 'dist/server', typedOptions: [] } };
  expect(readCommandDirectories({ context })).toEqual({
    configDirectory: '/app',
    serverDirectory: undefined,
  });
});
