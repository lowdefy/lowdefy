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

import { beforeEach, expect, test, vi } from 'vitest';

// Packages the tests install, keyed by import specifier. A specifier that is
// not listed does not resolve, as for a package that is not installed.
let installed = {};

vi.doMock('./importPluginModule.js', () => ({
  default: vi.fn(async ({ specifier }) => installed[specifier]),
}));

const { default: loadPluginTypeSchema } = await import('./loadPluginTypeSchema.js');

beforeEach(() => {
  installed = {};
});

const defaultButtonSchema = { type: 'object', description: 'default Button' };
const hazards = [{ id: 'button-hazard', message: 'A hazard.', see: null }];

function createContext() {
  return {
    typesMap: {
      schemas: {
        actions: { Wait: { package: '@lowdefy/actions-core', schema: { description: 'Wait' } } },
        blocks: {
          Button: { package: '@lowdefy/blocks-antd', schema: defaultButtonSchema, hazards },
        },
        operators: {},
      },
    },
  };
}

test('loadPluginTypeSchema returns the types map schema and hazards of a default block whose package does not import', async () => {
  const result = await loadPluginTypeSchema({
    context: createContext(),
    kind: 'blocks',
    type: { typeName: 'Button', originalTypeName: 'Button', package: '@lowdefy/blocks-antd' },
  });
  expect(result.schema).toBe(defaultButtonSchema);
  expect(result.meta).toEqual({ hazards });
});

test('loadPluginTypeSchema returns the types map schema of a default action whose package does not import', async () => {
  const result = await loadPluginTypeSchema({
    context: createContext(),
    kind: 'actions',
    type: { typeName: 'Wait', originalTypeName: 'Wait', package: '@lowdefy/actions-core' },
  });
  expect(result.schema).toEqual({ description: 'Wait' });
});

test('loadPluginTypeSchema checks a custom plugin that registers a default block type name against its own schema', async () => {
  installed['@lowdefy-test/custom-blocks/metas'] = {
    Button: { category: 'display', properties: { type: 'object', description: 'custom Button' } },
  };
  const result = await loadPluginTypeSchema({
    context: createContext(),
    kind: 'blocks',
    type: {
      typeName: 'Button',
      originalTypeName: 'Button',
      package: '@lowdefy-test/custom-blocks',
    },
  });
  expect(result.schema).not.toBe(defaultButtonSchema);
  expect(result.schema.properties.properties).toEqual({
    type: 'object',
    description: 'custom Button',
  });
  expect(result.meta.category).toEqual('display');
});

test('loadPluginTypeSchema gives a custom plugin that registers a default type name and does not import no schema', async () => {
  const result = await loadPluginTypeSchema({
    context: createContext(),
    kind: 'actions',
    type: { typeName: 'Wait', originalTypeName: 'Wait', package: '@lowdefy-test/custom-actions' },
  });
  expect(result.schema).toBe(undefined);
});
