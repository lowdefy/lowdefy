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

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { jest } from '@jest/globals';

jest.setTimeout(60000);

const fixture = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'testFixtures/importAppCodeTwice.mjs'
);

let configDir;

beforeEach(() => {
  configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-import-app-code-'));
  fs.writeFileSync(path.join(configDir, 'package.json'), '{ "type": "module" }');
});

afterEach(() => {
  fs.rmSync(configDir, { recursive: true, force: true });
});

// The dev server's JIT page builds import app code through Vite's SSR module
// runner when @lowdefy/build is linked (the monorepo), and natively when it is
// installed from npm.
test.each(['vite', 'node'])(
  'importAppCode loaded by %s imports an edited transformer again and reuses an unchanged one',
  async (loader) => {
    const { stdout } = await promisify(execFile)(process.execPath, [fixture, loader, configDir]);
    expect(JSON.parse(stdout)).toEqual({
      first: 'before',
      edited: 'after',
      unchangedReused: true,
    });
  }
);
