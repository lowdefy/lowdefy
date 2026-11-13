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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test } from 'vitest';

import readDotEnv from './readDotEnv.mjs';

let config;

beforeEach(() => {
  config = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dev-dotenv-'));
  delete process.env.LDF_DEV_DOTENV_TEST;
});

afterEach(() => {
  fs.rmSync(config, { recursive: true, force: true });
  delete process.env.LDF_DEV_DOTENV_TEST;
});

test('readDotEnv does nothing when the app has no .env file', () => {
  readDotEnv({ directories: { config } })();
  expect(process.env.LDF_DEV_DOTENV_TEST).toBe(undefined);
});

test('readDotEnv keeps a shell variable on the first load', () => {
  process.env.LDF_DEV_DOTENV_TEST = 'shell';
  fs.writeFileSync(path.join(config, '.env'), 'LDF_DEV_DOTENV_TEST=file\n');
  readDotEnv({ directories: { config } })();
  expect(process.env.LDF_DEV_DOTENV_TEST).toBe('shell');
});

test('readDotEnv takes a changed value from .env on a reload', () => {
  fs.writeFileSync(path.join(config, '.env'), 'LDF_DEV_DOTENV_TEST=first\n');
  const load = readDotEnv({ directories: { config } });
  load();
  expect(process.env.LDF_DEV_DOTENV_TEST).toBe('first');
  fs.writeFileSync(path.join(config, '.env'), 'LDF_DEV_DOTENV_TEST=second\n');
  load();
  expect(process.env.LDF_DEV_DOTENV_TEST).toBe('second');
});
