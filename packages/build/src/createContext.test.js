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

import createContext from './createContext.js';

let directories;

function writeFixture(relativePath, contents = '') {
  const absolutePath = path.join(directories.config, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
  return absolutePath;
}

beforeEach(() => {
  const config = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-create-context-'));
  directories = { config, build: path.join(config, '.lowdefy/build') };
});

afterEach(() => {
  fs.rmSync(directories.config, { recursive: true, force: true });
});

test('createContext adds discovered file plugins to the typesMap', () => {
  const file = writeFixture('plugins/blocks/Panel.jsx');
  writeFixture('plugins/operators/shared/_titleCase.js');
  const context = createContext({ customTypesMap: {}, directories, validateOnly: true });
  expect(context.typesMap.blocks.Panel).toEqual({
    package: null,
    packageId: 'file-plugin',
    originalTypeName: 'Panel',
    version: null,
    file,
    relativePath: 'plugins/blocks/Panel.jsx',
  });
  expect(context.typesMap.operators.client._titleCase.relativePath).toEqual(
    'plugins/operators/shared/_titleCase.js'
  );
  expect(context.typesMap.operators.server._titleCase.relativePath).toEqual(
    'plugins/operators/shared/_titleCase.js'
  );
  expect(context.filePluginExceptions).toEqual([]);
});

test('createContext reports a file plugin that collides with a package type', () => {
  writeFixture('plugins/blocks/Card.jsx');
  const context = createContext({
    customTypesMap: { blocks: { Card: { package: '@lowdefy/blocks-antd', version: '5.0.0' } } },
    directories,
    validateOnly: true,
  });
  expect(context.filePluginExceptions.map((exception) => exception.message)).toEqual([
    'Block type "Card" is defined by plugins/blocks/Card.jsx and by @lowdefy/blocks-antd.',
  ]);
  expect(context.filePluginExceptions[0].checkSlug).toEqual('block-types');
  expect(context.typesMap.blocks.Card.package).toEqual('@lowdefy/blocks-antd');
});

// The dev manager writes the same file plugins into customTypesMap.json for the
// docs endpoints, so the merge must not let that copy shadow a package type
// before the collision above is found.
test('createContext ignores file-plugin entries carried in customTypesMap', () => {
  writeFixture('plugins/blocks/Card.jsx');
  const context = createContext({
    customTypesMap: {
      blocks: {
        Card: {
          package: null,
          packageId: 'file-plugin',
          originalTypeName: 'Card',
          version: null,
          file: path.join(directories.config, 'plugins/blocks/Card.jsx'),
          relativePath: 'plugins/blocks/Card.jsx',
        },
      },
    },
    directories,
    validateOnly: true,
  });
  expect(context.filePluginExceptions).toEqual([]);
  expect(context.typesMap.blocks.Card.relativePath).toEqual('plugins/blocks/Card.jsx');
});

test('createContext reports a file plugin discovery error', () => {
  writeFixture('plugins/operators/client/slug.js');
  const context = createContext({ customTypesMap: {}, directories, validateOnly: true });
  expect(context.filePluginExceptions.map((exception) => exception.message)).toEqual([
    'Operator file plugin "plugins/operators/client/slug.js" must be named starting with an underscore.',
  ]);
});

test('createContext has no file plugins when the config directory has no plugins directory', () => {
  const context = createContext({ customTypesMap: {}, directories, validateOnly: true });
  expect(context.filePlugins).toEqual([]);
  expect(context.filePluginExceptions).toEqual([]);
});
