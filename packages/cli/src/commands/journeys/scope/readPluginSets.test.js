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

import readPluginSets from './readPluginSets.js';

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-plugins-'));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function writeLowdefyYaml(directory, plugins) {
  fs.mkdirSync(directory, { recursive: true });
  const lines = ['lowdefy: 6.0.0'];
  if (plugins.length > 0) {
    lines.push('plugins:');
    plugins.forEach(([name, version]) => {
      lines.push(`  - name: "${name}"`, `    version: "${version}"`);
    });
  }
  fs.writeFileSync(path.join(directory, 'lowdefy.yaml'), `${lines.join('\n')}\n`);
}

test('readPluginSets lists plugins only the base lists and plugins whose version changed', async () => {
  writeLowdefyYaml(path.join(root, 'base'), [
    ['@acme/blocks', '1.2.0'],
    ['@acme/legacy', '0.1.0'],
    ['@acme/same', '2.0.0'],
  ]);
  writeLowdefyYaml(path.join(root, 'head'), [
    ['@acme/blocks', '1.3.0'],
    ['@acme/same', '2.0.0'],
    ['@acme/new', '1.0.0'],
  ]);
  expect(
    await readPluginSets({
      baseConfigDirectory: path.join(root, 'base'),
      headConfigDirectory: path.join(root, 'head'),
    })
  ).toEqual({
    missingFromHead: ['@acme/legacy'],
    versionChanged: [{ name: '@acme/blocks', base: '1.2.0', head: '1.3.0' }],
  });
});

test('readPluginSets is empty when neither tree lists plugins', async () => {
  writeLowdefyYaml(path.join(root, 'base'), []);
  writeLowdefyYaml(path.join(root, 'head'), []);
  expect(
    await readPluginSets({
      baseConfigDirectory: path.join(root, 'base'),
      headConfigDirectory: path.join(root, 'head'),
    })
  ).toEqual({ missingFromHead: [], versionChanged: [] });
});
