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

import addFilePluginTypesToMap from './addFilePluginTypesToMap.mjs';

let directories;

function writeFixture(relativePath, contents = '') {
  const absolutePath = path.join(directories.config, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
  return absolutePath;
}

function emptyTypesMap() {
  return { actions: {}, blocks: {}, operators: { client: {}, server: {} } };
}

beforeEach(() => {
  directories = { config: fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-file-plugin-map-')) };
});

afterEach(() => {
  fs.rmSync(directories.config, { recursive: true, force: true });
});

test('addFilePluginTypesToMap adds a block, an action and a shared operator to the typesMap', () => {
  const blockFile = writeFixture('plugins/blocks/Panel.jsx');
  writeFixture('plugins/actions/CopyRow.js');
  writeFixture('plugins/operators/shared/_titleCase.js');
  const typesMap = emptyTypesMap();

  const records = addFilePluginTypesToMap({ directories, typesMap });

  expect(records).toHaveLength(4);
  expect(typesMap.blocks.Panel).toEqual({
    package: null,
    packageId: 'file-plugin',
    originalTypeName: 'Panel',
    version: null,
    file: blockFile,
    relativePath: 'plugins/blocks/Panel.jsx',
  });
  expect(typesMap.actions.CopyRow.relativePath).toEqual('plugins/actions/CopyRow.js');
  expect(typesMap.operators.client._titleCase.relativePath).toEqual(
    'plugins/operators/shared/_titleCase.js'
  );
  expect(typesMap.operators.server._titleCase.relativePath).toEqual(
    'plugins/operators/shared/_titleCase.js'
  );
});

test('addFilePluginTypesToMap creates the operators.build store the dev typesMap does not have', () => {
  writeFixture('plugins/operators/build/_env.js');
  const typesMap = emptyTypesMap();

  addFilePluginTypesToMap({ directories, typesMap });

  expect(typesMap.operators.build._env.relativePath).toEqual('plugins/operators/build/_env.js');
});

test('addFilePluginTypesToMap carries sibling meta and schema onto the definition', () => {
  writeFixture('plugins/blocks/Panel.jsx');
  writeFixture(
    'plugins/blocks/Panel.json',
    JSON.stringify({ meta: { category: 'container' }, schema: { type: 'object' } })
  );
  const typesMap = emptyTypesMap();

  addFilePluginTypesToMap({ directories, typesMap });

  expect(typesMap.blocks.Panel.meta).toEqual({ category: 'container' });
  expect(typesMap.blocks.Panel.schema).toEqual({ type: 'object' });
});

// createContext runs the same discovery for every build and buildTypes reports
// the collision there with its file location, so the dev map must keep the
// package type and report nothing.
test('addFilePluginTypesToMap keeps a package type a file plugin collides with', () => {
  writeFixture('plugins/blocks/Card.jsx');
  const typesMap = emptyTypesMap();
  typesMap.blocks.Card = { package: '@lowdefy/blocks-antd', version: '5.0.0' };

  addFilePluginTypesToMap({ directories, typesMap });

  expect(typesMap.blocks.Card).toEqual({ package: '@lowdefy/blocks-antd', version: '5.0.0' });
});

test('addFilePluginTypesToMap leaves the typesMap unchanged when there are no file plugins', () => {
  const typesMap = emptyTypesMap();

  expect(addFilePluginTypesToMap({ directories, typesMap })).toEqual([]);
  expect(typesMap).toEqual(emptyTypesMap());
});
