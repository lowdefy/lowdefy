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
import { jest } from '@jest/globals';

import loadFilePluginBlockSchemas from './loadFilePluginBlockSchemas.js';

function createContext(filePlugins) {
  return {
    blockSchemas: {},
    blockPluginMetas: {},
    errors: [],
    filePlugins,
    handleWarning: jest.fn(),
  };
}

test('loadFilePluginBlockSchemas builds a schema from the sibling JSON meta', () => {
  const context = createContext([
    {
      kind: 'blocks',
      typeName: 'Badge',
      checkSlug: 'block-types',
      relativePath: 'plugins/blocks/Badge.jsx',
      meta: { category: 'display', properties: { type: 'object' } },
    },
  ]);
  loadFilePluginBlockSchemas({ context });
  expect(context.errors).toEqual([]);
  expect(context.blockPluginMetas.Badge).toEqual({
    category: 'display',
    properties: { type: 'object' },
  });
  // buildBlockSchema wraps the meta properties in the standard block envelope.
  expect(context.blockSchemas.Badge).toHaveProperty('properties');
});

test('loadFilePluginBlockSchemas uses a declared schema over the generated one', () => {
  const schema = { properties: { type: 'object', properties: { count: { type: 'number' } } } };
  const context = createContext([
    {
      kind: 'blocks',
      typeName: 'Badge',
      checkSlug: 'block-types',
      relativePath: 'plugins/blocks/Badge.jsx',
      meta: { category: 'display' },
      schema,
    },
  ]);
  loadFilePluginBlockSchemas({ context });
  expect(context.blockSchemas.Badge).toEqual(schema);
});

test('loadFilePluginBlockSchemas skips a block whose meta is missing', () => {
  const context = createContext([
    {
      kind: 'blocks',
      typeName: 'Badge',
      checkSlug: 'block-types',
      relativePath: 'plugins/blocks/Badge.jsx',
    },
  ]);
  loadFilePluginBlockSchemas({ context });
  expect(context.blockSchemas).toEqual({});
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('has no meta');
});

test('loadFilePluginBlockSchemas ignores actions and operators', () => {
  const context = createContext([
    { kind: 'actions', typeName: 'CopyRow', relativePath: 'plugins/actions/CopyRow.js' },
    {
      kind: 'operators.client',
      typeName: '_titleCase',
      relativePath: 'plugins/operators/shared/_titleCase.js',
    },
  ]);
  loadFilePluginBlockSchemas({ context });
  expect(context.blockSchemas).toEqual({});
  expect(context.errors).toEqual([]);
});
