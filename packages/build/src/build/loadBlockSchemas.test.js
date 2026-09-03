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
import { ConfigError } from '@lowdefy/errors';

import loadBlockSchemas from './loadBlockSchemas.js';

function createContext(typesMap) {
  return { typesMap, directories: { server: '' } };
}

test('loadBlockSchemas builds an empty map when no block types are installed', async () => {
  const context = createContext({ blocks: {} });
  const components = {};
  const result = await loadBlockSchemas({ components, context });
  expect(result).toBe(components);
  expect(context.blockSchemas).toEqual({});
  expect(context.blockPluginMetas).toEqual({});
});

test('loadBlockSchemas builds full block schemas from the package metas', async () => {
  const context = createContext({
    blocks: {
      Box: { package: '@lowdefy/blocks-basic', version: '0.0.0', originalTypeName: 'Box' },
      Span: { package: '@lowdefy/blocks-basic', version: '0.0.0', originalTypeName: 'Span' },
    },
  });
  await loadBlockSchemas({ components: {}, context });
  expect(Object.keys(context.blockSchemas).sort()).toEqual(['Box', 'Span']);
  expect(context.blockSchemas.Box.properties.properties.type).toEqual('object');
  expect(context.blockSchemas.Box.properties.properties.properties.content).toBeDefined();
  expect(context.blockPluginMetas.Box.category).toBeDefined();
});

test('loadBlockSchemas keys schemas by the aliased type name', async () => {
  const context = createContext({
    blocks: {
      MyBox: { package: '@lowdefy/blocks-basic', version: '0.0.0', originalTypeName: 'Box' },
    },
  });
  await loadBlockSchemas({ components: {}, context });
  expect(Object.keys(context.blockSchemas)).toEqual(['MyBox']);
  expect(Object.keys(context.blockPluginMetas)).toEqual(['MyBox']);
});

test('loadBlockSchemas prefers typesMap schemas over package metas', async () => {
  const customSchema = {
    properties: { type: 'object', properties: { custom: { type: 'boolean' } } },
  };
  const context = createContext({
    blocks: {
      Box: { package: '@lowdefy/blocks-basic', version: '0.0.0', originalTypeName: 'Box' },
    },
    schemas: { blocks: { Box: customSchema } },
  });
  await loadBlockSchemas({ components: {}, context });
  expect(context.blockSchemas.Box).toBe(customSchema);
  expect(context.blockPluginMetas.Box).toBeDefined();
});

test('loadBlockSchemas uses typesMap schemas for a type whose package cannot be imported', async () => {
  const customSchema = { properties: { type: 'object' } };
  const context = createContext({
    blocks: {
      CustomBlock: { package: 'custom-plugin', version: '0.0.0', originalTypeName: 'CustomBlock' },
    },
    schemas: { blocks: { CustomBlock: customSchema } },
  });
  await loadBlockSchemas({ components: {}, context });
  expect(context.blockSchemas).toEqual({ CustomBlock: customSchema });
  expect(context.blockPluginMetas).toEqual({});
});

test('loadBlockSchemas contributes nothing for a package whose metas cannot be imported', async () => {
  const context = createContext({
    blocks: {
      FakeBlock: {
        package: 'non-existent-package',
        version: '0.0.0',
        originalTypeName: 'FakeBlock',
      },
    },
  });
  await expect(loadBlockSchemas({ components: {}, context })).resolves.toEqual({});
  expect(context.blockSchemas).toEqual({});
});

test('loadBlockSchemas collects a ConfigError for a type the package metas do not define', async () => {
  const context = createContext({
    blocks: {
      Missing: { package: '@lowdefy/blocks-basic', version: '0.0.0', originalTypeName: 'Nope' },
    },
  });
  context.errors = [];
  await loadBlockSchemas({ components: {}, context });
  expect(context.blockSchemas).toEqual({});
  expect(context.blockPluginMetas).toEqual({});
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigError);
  expect(context.errors[0].message).toBe(
    'Block type "Missing" from package "@lowdefy/blocks-basic": has no meta. Export it from "@lowdefy/blocks-basic/metas" as { Missing: meta } with at least { category }.'
  );
});

test('loadBlockSchemas validates every core block meta without errors or warnings', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const buildPackage = require('../../package.json');
  const blockPackages = Object.keys(buildPackage.dependencies).filter((name) =>
    name.startsWith('@lowdefy/blocks-')
  );
  expect(blockPackages.length).toBeGreaterThan(0);
  const blocks = {};
  for (const packageName of blockPackages) {
    const { default: types } = await import(`${packageName}/types`);
    for (const typeName of types.blocks) {
      blocks[`${packageName}:${typeName}`] = {
        package: packageName,
        version: '0.0.0',
        originalTypeName: typeName,
      };
    }
  }
  const context = createContext({ blocks });
  context.errors = [];
  context.handleWarning = jest.fn();
  await loadBlockSchemas({ components: {}, context });
  expect(context.errors).toEqual([]);
  expect(context.handleWarning).not.toHaveBeenCalled();
  expect(Object.keys(context.blockPluginMetas).sort()).toEqual(Object.keys(blocks).sort());
});
