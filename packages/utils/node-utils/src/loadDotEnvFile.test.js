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

import loadDotEnvFile from './loadDotEnvFile.js';

const NAMES = ['LDF_TEST_ONE', 'LDF_TEST_TWO', 'LDF_TEST_SHELL', 'LDF_TEST_EMPTY'];

let directory;
let filePath;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dotenv-'));
  filePath = path.join(directory, '.env');
  NAMES.forEach((name) => delete process.env[name]);
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
  NAMES.forEach((name) => delete process.env[name]);
});

test('loadDotEnvFile does nothing when the file does not exist', () => {
  expect(loadDotEnvFile({ filePath })).toBe(undefined);
  expect(process.env.LDF_TEST_ONE).toBe(undefined);
});

test('loadDotEnvFile loads the variables in the file', () => {
  fs.writeFileSync(
    filePath,
    '# comment\nLDF_TEST_ONE=one\nexport LDF_TEST_TWO="two # not a comment"\nmalformed line\n'
  );
  loadDotEnvFile({ filePath });
  expect(process.env.LDF_TEST_ONE).toBe('one');
  expect(process.env.LDF_TEST_TWO).toBe('two # not a comment');
});

test('loadDotEnvFile does not overwrite a variable already in the environment', () => {
  process.env.LDF_TEST_SHELL = 'from shell';
  process.env.LDF_TEST_EMPTY = '';
  fs.writeFileSync(filePath, 'LDF_TEST_SHELL=from file\nLDF_TEST_EMPTY=from file\n');
  loadDotEnvFile({ filePath });
  expect(process.env.LDF_TEST_SHELL).toBe('from shell');
  expect(process.env.LDF_TEST_EMPTY).toBe('');
});

test('loadDotEnvFile overwrites a variable already in the environment with override', () => {
  process.env.LDF_TEST_SHELL = 'old';
  fs.writeFileSync(filePath, 'LDF_TEST_SHELL=new\n');
  loadDotEnvFile({ filePath, override: true });
  expect(process.env.LDF_TEST_SHELL).toBe('new');
});

test('loadDotEnvFile reads the first variable of a file saved with a byte order mark', () => {
  fs.writeFileSync(filePath, '﻿LDF_TEST_ONE=one\nLDF_TEST_TWO=two\n');
  loadDotEnvFile({ filePath });
  expect(process.env.LDF_TEST_ONE).toBe('one');
  expect(process.env.LDF_TEST_TWO).toBe('two');
});

test('loadDotEnvFile throws when the path cannot be read as a file', () => {
  fs.mkdirSync(filePath);
  expect(() => loadDotEnvFile({ filePath })).toThrow(expect.objectContaining({ code: 'EISDIR' }));
});
