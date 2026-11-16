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

import path from 'node:path';

import { expect, test } from 'vitest';

import getDirectories from './getDirectories.js';

test('getDirectories defaults to the working directory and its .lowdefy/server', () => {
  expect(getDirectories({})).toEqual({
    build: path.join(process.cwd(), '.lowdefy', 'server', 'build'),
    config: process.cwd(),
    server: path.join(process.cwd(), '.lowdefy', 'server'),
  });
});

test('getDirectories puts the server under a named config directory', () => {
  expect(getDirectories({ configDirectory: '/apps/crm' })).toEqual({
    build: path.resolve('/apps/crm/.lowdefy/server/build'),
    config: path.resolve('/apps/crm'),
    server: path.resolve('/apps/crm/.lowdefy/server'),
  });
});

test('getDirectories resolves a relative server directory from the working directory', () => {
  expect(getDirectories({ serverDirectory: '_server/prod' })).toEqual({
    build: path.join(process.cwd(), '_server', 'prod', 'build'),
    config: process.cwd(),
    server: path.join(process.cwd(), '_server', 'prod'),
  });
});
