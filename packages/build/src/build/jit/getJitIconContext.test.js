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

import getJitIconContext from './getJitIconContext.js';

function writeTheme(theme) {
  const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-jit-icons-'));
  fs.writeFileSync(path.join(buildDir, 'theme.json'), JSON.stringify(theme));
  return buildDir;
}

test('getJitIconContext loads icon sets and the semantic map from the built theme', async () => {
  const buildDir = writeTheme({ icons: { set: 'lucide', aliases: { invoice: 'Receipt' } } });
  const context = { directories: { build: buildDir }, typesMap: { iconSets: {} } };
  const icons = await getJitIconContext({ context });
  expect(icons.defaultSet).toBe('lucide');
  expect(icons.semantic.invoice).toBe('Receipt');
  expect(icons.semantic.edit).toBe('Pencil');
  // Cached: concurrent page builds share one load.
  expect(getJitIconContext({ context })).toBe(getJitIconContext({ context }));
});

test('getJitIconContext uses context.icons when the build already created it', async () => {
  const icons = { sets: {}, defaultSet: 'lucide', semantic: {} };
  expect(await getJitIconContext({ context: { icons } })).toBe(icons);
});
