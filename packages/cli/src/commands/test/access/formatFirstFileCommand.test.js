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

import formatFirstFileCommand from './formatFirstFileCommand.js';

test('formatFirstFileCommand names no directory for an app in the working directory', () => {
  expect(formatFirstFileCommand({ configDirectory: process.cwd() })).toBe(
    'lowdefy build --no-client-build && lowdefy test --update-access'
  );
});

test('formatFirstFileCommand names the app relative to the working directory when inside it', () => {
  const configDirectory = path.join(process.cwd(), 'apps', 'shop');
  const directory = path.join('apps', 'shop');
  expect(formatFirstFileCommand({ configDirectory })).toBe(
    `lowdefy build --no-client-build --config-directory ${directory} && lowdefy test --update-access --config-directory ${directory}`
  );
});

test('formatFirstFileCommand names an app outside the working directory by its full path', () => {
  const configDirectory = path.join(os.tmpdir(), 'shop');
  expect(formatFirstFileCommand({ configDirectory })).toBe(
    `lowdefy build --no-client-build --config-directory ${configDirectory} && lowdefy test --update-access --config-directory ${configDirectory}`
  );
});
