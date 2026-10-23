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

import propertiesFormTransformer from '../blocks/propertiesFormTransformer.js';
import propertiesGetterTransformer from '../blocks/propertiesGetterTransformer.js';
import defaultValueTransformer from '../blocks/defaultValueTransformer.js';
import { expect, test } from 'vitest';

const schema = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      str: {
        type: 'string',
        description: 'String description.',
      },
    },
  },
};

test('string propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    [
      {
        "id": "block.properties.str",
        "layout": {
          "_global": "settings_input_layout",
        },
        "properties": {
          "label": {
            "align": "right",
            "extra": "String description.",
            "span": 8,
          },
          "size": "small",
          "title": "str",
        },
        "required": false,
        "type": "TextInput",
      },
    ]
  `);
});

test('string propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schema, { block_type: 'Block' })).toMatchInlineSnapshot(`
    {
      "_object.assign": [
        {
          "_state": {
            "contextId": "Block:Block:{}",
            "default": {},
            "key": "block.properties",
          },
        },
      ],
    }
  `);
});

test('string defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    {
      "str": null,
    }
  `);
  const schemaDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        str: {
          type: 'string',
          default: 'str_default',
          description: 'String description.',
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "str": "str_default",
    }
  `);
});
