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

// The bundled dayjs locale list must be the one the installed dayjs ships: run
// scripts/createDayjsLocales.mjs after a dayjs upgrade.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import createDayjsLocales from './createDayjsLocales.mjs';

const shellRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('src/locale/dayjsLocales.js lists every locale the installed dayjs ships', () => {
  const written = fs.readFileSync(path.join(shellRoot, 'src/locale/dayjsLocales.js'), 'utf8');
  assert.equal(written, createDayjsLocales());
});
