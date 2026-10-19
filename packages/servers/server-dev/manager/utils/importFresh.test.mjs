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

import importFresh from './importFresh.mjs';

let pluginDir;

beforeEach(() => {
  pluginDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-import-fresh-'));
  fs.writeFileSync(path.join(pluginDir, 'package.json'), JSON.stringify({ type: 'module' }));
  fs.writeFileSync(
    path.join(pluginDir, 'types.js'),
    "import * as metas from './metas.js';\nexport default { blocks: Object.keys(metas) };\n"
  );
});

afterEach(() => {
  fs.rmSync(pluginDir, { recursive: true, force: true });
});

test('importFresh returns the default export of the module', async () => {
  fs.writeFileSync(path.join(pluginDir, 'metas.js'), 'export const Card = {};\n');

  const types = await importFresh(path.join(pluginDir, 'types.js'));

  expect(types).toEqual({ blocks: ['Card'] });
});

test('importFresh sees a change to a module the imported file imports', async () => {
  fs.writeFileSync(path.join(pluginDir, 'metas.js'), 'export const Card = {};\n');
  const before = await importFresh(path.join(pluginDir, 'types.js'));

  fs.writeFileSync(
    path.join(pluginDir, 'metas.js'),
    'export const Card = {};\nexport const TaskList = {};\n'
  );
  const after = await importFresh(path.join(pluginDir, 'types.js'));

  expect(before).toEqual({ blocks: ['Card'] });
  expect(after).toEqual({ blocks: ['Card', 'TaskList'] });
});

test('importFresh returns the namespace of a module without a default export', async () => {
  fs.writeFileSync(path.join(pluginDir, 'messages.js'), "export const hello = 'Hello';\n");

  const messages = await importFresh(path.join(pluginDir, 'messages.js'));

  expect(messages).toEqual({ hello: 'Hello' });
});

test('importFresh rejects when the module throws', async () => {
  fs.writeFileSync(path.join(pluginDir, 'broken.js'), "throw new Error('Broken plugin.');\n");

  await expect(importFresh(path.join(pluginDir, 'broken.js'))).rejects.toThrow('Broken plugin.');
});
