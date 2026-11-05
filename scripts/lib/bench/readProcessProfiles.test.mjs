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

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import readProcessProfiles from './readProcessProfiles.mjs';

test('readProcessProfiles reads the main thread profiles of the given processes', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-profiles-'));
  [
    ['CPU.20261029.103042.84233.0.001.cpuprofile', { pass: 1 }],
    ['CPU.20261029.103042.84233.1.002.cpuprofile', { worker: true }],
    ['CPU.20261029.103041.84084.0.001.cpuprofile', { cli: true }],
    ['CPU.20261029.103110.84390.0.001.cpuprofile', { pass: 2 }],
  ].forEach(([name, profile]) =>
    fs.writeFileSync(path.join(directory, name), JSON.stringify(profile))
  );

  assert.deepEqual(readProcessProfiles({ directory, pids: [84233, 84390] }), [
    { file: 'CPU.20261029.103042.84233.0.001.cpuprofile', profile: { pass: 1 } },
    { file: 'CPU.20261029.103110.84390.0.001.cpuprofile', profile: { pass: 2 } },
  ]);
  fs.rmSync(directory, { recursive: true });
});
