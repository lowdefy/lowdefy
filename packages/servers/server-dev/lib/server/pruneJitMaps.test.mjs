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

import pruneJitMaps from './pruneJitMaps.js';

let buildDirectory;

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-prune-jit-maps-'));
  fs.mkdirSync(path.join(buildDirectory, 'jitMaps'));
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('pruneJitMaps keeps the named context and temporary files, removing every other jitMaps file', () => {
  for (const file of [
    'abc-1-1.json',
    'abc-2-1.json',
    'def-1-1.json',
    '.abc-1-2.json.123.abcd1234.tmp',
  ]) {
    fs.writeFileSync(path.join(buildDirectory, 'jitMaps', file), '{}');
  }

  pruneJitMaps({ buildDirectory, keep: 'abc-2-' });

  expect(fs.readdirSync(path.join(buildDirectory, 'jitMaps')).sort()).toEqual([
    '.abc-1-2.json.123.abcd1234.tmp',
    'abc-2-1.json',
  ]);
});

test('pruneJitMaps does nothing when no page has been built', () => {
  fs.rmSync(path.join(buildDirectory, 'jitMaps'), { recursive: true });
  expect(() => pruneJitMaps({ buildDirectory, keep: 'abc-1-' })).not.toThrow();
});
