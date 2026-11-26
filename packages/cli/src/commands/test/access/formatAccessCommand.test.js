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
import os from 'os';
import path from 'path';

import formatAccessCommand from './formatAccessCommand.js';

test('formatAccessCommand names no directory for an app in the working directory and the default build', () => {
  expect(formatAccessCommand({ args: 'test --access', configDirectory: process.cwd() })).toBe(
    'lowdefy test --access'
  );
});

test('formatAccessCommand names an app inside the working directory by its relative path', () => {
  const configDirectory = path.join(process.cwd(), 'apps', 'shop');
  expect(formatAccessCommand({ args: 'test --access', configDirectory })).toBe(
    `lowdefy test --access --config-directory ${path.join('apps', 'shop')}`
  );
});

test('formatAccessCommand names an app outside the working directory by its full path', () => {
  const configDirectory = path.join(os.tmpdir(), 'shop');
  expect(formatAccessCommand({ args: 'test --access', configDirectory })).toBe(
    `lowdefy test --access --config-directory ${configDirectory}`
  );
});

test('formatAccessCommand quotes a directory that holds a space', () => {
  const configDirectory = path.join(os.tmpdir(), 'my shop');
  expect(formatAccessCommand({ args: 'test --access', configDirectory })).toBe(
    `lowdefy test --access --config-directory "${configDirectory}"`
  );
});

test('formatAccessCommand passes on a server directory the run was given', () => {
  const serverDirectory = path.join(process.cwd(), 'dist', 'server');
  expect(
    formatAccessCommand({
      args: 'test --update-access',
      configDirectory: process.cwd(),
      serverDirectory,
    })
  ).toBe(`lowdefy test --update-access --server-directory ${path.join('dist', 'server')}`);
});
