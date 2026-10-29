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

import { expect, test } from 'vitest';

import mergeTypesMaps from './mergeTypesMaps.js';

const buttonSchema = { type: 'object' };

const defaultTypesMap = {
  blocks: { Button: { package: '@lowdefy/blocks-antd' } },
  schemas: {
    actions: {},
    blocks: { Button: { package: '@lowdefy/blocks-antd', schema: buttonSchema } },
    operators: {},
  },
  hasChecks: { '@lowdefy/blocks-antd': false },
};

test('mergeTypesMaps keeps the default schema objects rather than copies, across builds', () => {
  const first = mergeTypesMaps({ defaultTypesMap, customTypesMap: {} });
  const second = mergeTypesMaps({ defaultTypesMap, customTypesMap: {} });
  expect(first.schemas.blocks.Button).toBe(defaultTypesMap.schemas.blocks.Button);
  expect(second.schemas.blocks.Button.schema).toBe(buttonSchema);
  expect(first.schemas.blocks).not.toBe(defaultTypesMap.schemas.blocks);
});

test('mergeTypesMaps merges the custom types and schemas over the defaults', () => {
  const customSchema = { package: 'custom-plugin', schema: { type: 'object' } };
  const typesMap = mergeTypesMaps({
    defaultTypesMap,
    customTypesMap: {
      blocks: { Card: { package: 'custom-plugin' } },
      schemas: { blocks: { Card: customSchema } },
    },
  });
  expect(typesMap.blocks).toEqual({
    Button: { package: '@lowdefy/blocks-antd' },
    Card: { package: 'custom-plugin' },
  });
  expect(typesMap.schemas.blocks.Button.schema).toBe(buttonSchema);
  expect(typesMap.schemas.blocks.Card).toEqual(customSchema);
  expect(typesMap.hasChecks).toEqual({ '@lowdefy/blocks-antd': false });
});

test('mergeTypesMaps leaves the default types map unchanged', () => {
  mergeTypesMaps({
    defaultTypesMap,
    customTypesMap: { blocks: { Card: { package: 'custom-plugin' } } },
  });
  expect(Object.keys(defaultTypesMap.blocks)).toEqual(['Button']);
});
