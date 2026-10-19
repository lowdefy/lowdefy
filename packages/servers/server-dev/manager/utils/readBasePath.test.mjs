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

import readBasePath from './readBasePath.mjs';

let buildDirectory;

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-read-base-path-'));
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('readBasePath returns the basePath from the build config', () => {
  fs.writeFileSync(path.join(buildDirectory, 'config.json'), JSON.stringify({ basePath: '/app' }));

  expect(readBasePath({ directories: { build: buildDirectory } })).toEqual('/app');
});

test('readBasePath returns an empty string when the app sets no basePath', () => {
  fs.writeFileSync(path.join(buildDirectory, 'config.json'), JSON.stringify({ theme: {} }));

  expect(readBasePath({ directories: { build: buildDirectory } })).toEqual('');
});
