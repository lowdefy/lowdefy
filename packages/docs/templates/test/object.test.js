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
        properties: {
          str: {
            type: 'string',
            description: 'str description',
          },
          num: {
            type: 'number',
            description: 'num description',
          },
        },
      },
    },
  },
};

test('object propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "id": "block.properties.field.num",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "label": {
                "align": "right",
                "extra": "num description",
                "span": 8,
              },
              "size": "small",
              "step": 0.1,
              "title": "num",
            },
            "required": false,
            "type": "NumberInput",
          },
          {
            "id": "block.properties.field.str",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "label": {
                "align": "right",
                "extra": "str description",
                "span": 8,
              },
              "size": "small",
              "title": "str",
            },
            "required": false,
            "type": "TextInput",
          },
        ],
        "id": "block.properties.field",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "bodyStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "field:",
        },
        "type": "Card",
      },
    ]
  `);
});

test('object propertiesGetterTransformer', () => {
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
            "_object.assign": [
              {
                "_state": {
                  "contextId": "Block:Block:{}",
                  "default": {},
                  "key": "block.properties.field",
                },
              },
            ],
          },
        },
      ],
    }
  `);
});

test('object defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    {
      "field": {
        "num": null,
        "str": null,
      },
    }
  `);
  const schemaDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        field: {
          type: 'object',
          default: {
            num: 1,
          },
          description: 'description',
          properties: {
            str: {
              type: 'string',
              description: 'str description',
            },
            num: {
              type: 'number',
              description: 'num description',
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "field": {
        "num": 1,
        "str": null,
      },
    }
  `);
});

const schemaNested = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      field: {
        type: 'object',
        default: {
          num: 1,
        },
        description: 'description',
        properties: {
          str: {
            type: 'string',
            description: 'str description',
          },
          num: {
            type: 'number',
            description: 'num description',
          },
          bool: {
            type: 'boolean',
            default: true,
            description: 'bool description',
          },
          obj: {
            type: 'object',
            description: 'obj description',
            properties: {
              str: {
                type: 'string',
                description: 'obj.str description',
              },
            },
          },
        },
      },
    },
  },
};

test('object schemaNested propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaNested)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "id": "block.properties.field.bool",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "label": {
                "align": "right",
                "extra": "bool description",
                "span": 8,
              },
              "size": "small",
              "title": "bool",
            },
            "required": false,
            "type": "Switch",
          },
          {
            "id": "block.properties.field.num",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "label": {
                "align": "right",
                "extra": "num description",
                "span": 8,
              },
              "size": "small",
              "step": 0.1,
              "title": "num",
            },
            "required": false,
            "type": "NumberInput",
          },
          {
            "blocks": [
              {
                "id": "block.properties.field.obj.str",
                "layout": {
                  "_global": "settings_input_layout",
                },
                "properties": {
                  "label": {
                    "align": "right",
                    "extra": "obj.str description",
                    "span": 8,
                  },
                  "size": "small",
                  "title": "str",
                },
                "required": false,
                "type": "TextInput",
              },
            ],
            "id": "block.properties.field.obj",
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
          {
            "id": "block.properties.field.str",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "label": {
                "align": "right",
                "extra": "str description",
                "span": 8,
              },
              "size": "small",
              "title": "str",
            },
            "required": false,
            "type": "TextInput",
          },
        ],
        "id": "block.properties.field",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "bodyStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "field:",
        },
        "type": "Card",
      },
    ]
  `);
});

test('object schemaNested propertiesGetterTransformer', () => {
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
          "field": {
            "_object.assign": [
              {
                "_state": {
                  "contextId": "Block:Block:{}",
                  "default": {},
                  "key": "block.properties.field",
                },
              },
              {
                "obj": {
                  "_object.assign": [
                    {
                      "_state": {
                        "contextId": "Block:Block:{}",
                        "default": {},
                        "key": "block.properties.field.obj",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    }
  `);
});

test('object schemaNested defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaNested)).toMatchInlineSnapshot(`
    {
      "field": {
        "bool": true,
        "num": 1,
        "obj": {
          "str": null,
        },
        "str": null,
      },
    }
  `);
  const schemaDVNested = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        field: {
          type: 'object',
          default: {
            num: 1,
          },
          description: 'description',
          properties: {
            str: {
              type: 'string',
              description: 'str description',
            },
            num: {
              type: 'number',
              description: 'num description',
            },
            bool: {
              type: 'boolean',
              default: true,
              description: 'bool description',
            },
            obj: {
              type: 'object',
              default: {
                str: 'a',
              },
              description: 'obj description',
              properties: {
                str: {
                  type: 'string',
                  description: 'obj.str description',
                },
              },
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDVNested)).toMatchInlineSnapshot(`
    {
      "field": {
        "bool": true,
        "num": 1,
        "obj": {
          "str": "a",
        },
        "str": null,
      },
    }
  `);
});
