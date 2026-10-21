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
      field: {
        type: 'object',
        description: 'description',
        docs: {
          displayType: 'manual',
          block: {
            id: 'manual',
            type: 'TestInput',
          },
          getter: {
            a: 1,
          },
        },
      },
    },
  },
};

test('manual propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    [
      {
        "id": "manual",
        "type": "TestInput",
      },
    ]
  `);
});

test('manual propertiesGetterTransformer', () => {
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
        {
          "field": {
            "a": 1,
          },
        },
      ],
    }
  `);
});

test('manual defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`{}`);
  const schemaDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        field: {
          type: 'object',
          default: 'value',
          description: 'description',
          docs: {
            displayType: 'manual',
            block: {
              id: 'manual',
              type: 'TestInput',
            },
            getter: {
              a: 1,
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "field": "value",
    }
  `);
});

const schemaNested = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      obj: {
        type: 'object',
        description: 'obj description',
        properties: {
          field: {
            type: 'object',
            description: 'field description',
            docs: {
              displayType: 'manual',
              block: {
                id: 'manual',
                type: 'TestInput',
              },
              getter: {
                a: 1,
              },
            },
          },
        },
      },
    },
  },
};

test('manual schemaNested propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaNested)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "id": "manual",
            "type": "TestInput",
          },
        ],
        "id": "block.properties.obj",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "bodyStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "obj:",
        },
        "type": "Card",
      },
    ]
  `);
});

test('manual schemaNested propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaNested, { block_type: 'Block' })).toMatchInlineSnapshot(`
    {
      "_object.assign": [
        {
          "_state": {
            "contextId": "Block:Block:{}",
            "default": {},
            "key": "block.properties",
          },
        },
        {
          "obj": {
            "_object.assign": [
              {
                "_state": {
                  "contextId": "Block:Block:{}",
                  "default": {},
                  "key": "block.properties.obj",
                },
              },
              {
                "field": {
                  "a": 1,
                },
              },
            ],
          },
        },
      ],
    }
  `);
});

test('manual schemaNested defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaNested)).toMatchInlineSnapshot(`{}`);
  const schemaDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        obj: {
          type: 'object',
          description: 'obj description',
          properties: {
            field: {
              type: 'object',
              default: { a: 1 },
              description: 'field description',
              docs: {
                displayType: 'manual',
                block: {
                  id: 'manual',
                  type: 'TestInput',
                },
                getter: {
                  a: 1,
                },
              },
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "obj": {
        "field": {
          "a": 1,
        },
      },
    }
  `);
});
