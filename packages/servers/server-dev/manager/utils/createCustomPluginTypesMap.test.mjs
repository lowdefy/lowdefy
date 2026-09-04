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

import createCustomPluginTypesMap from './createCustomPluginTypesMap.mjs';

let directories;

function writeFixture(relativePath, contents = '') {
  const absolutePath = path.join(directories.config, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
  return absolutePath;
}

beforeEach(() => {
  directories = { config: fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-dev-types-map-')) };
});

afterEach(() => {
  fs.rmSync(directories.config, { recursive: true, force: true });
});

// The dev manager persists this map as customTypesMap.json, which is what the
// JIT page builder and the docs endpoints read.
test('createCustomPluginTypesMap includes the config directory file plugins', async () => {
  writeFixture('lowdefy.yaml', 'lowdefy: 5.5.1\n');
  const blockFile = writeFixture('plugins/blocks/Panel.jsx');
  writeFixture('plugins/operators/server/_lookup.js');

  const customTypesMap = await createCustomPluginTypesMap({ directories, logger: console });

  expect(customTypesMap.blocks.Panel).toEqual({
    package: null,
    packageId: 'file-plugin',
    originalTypeName: 'Panel',
    version: null,
    file: blockFile,
    relativePath: 'plugins/blocks/Panel.jsx',
  });
  expect(customTypesMap.operators.server._lookup.relativePath).toEqual(
    'plugins/operators/server/_lookup.js'
  );
});

test('createCustomPluginTypesMap is empty when there are no plugins of either kind', async () => {
  writeFixture('lowdefy.yaml', 'lowdefy: 5.5.1\n');

  const customTypesMap = await createCustomPluginTypesMap({ directories, logger: console });

  expect(customTypesMap.blocks).toEqual({});
  expect(customTypesMap.actions).toEqual({});
  expect(customTypesMap.operators).toEqual({ client: {}, server: {} });
});
