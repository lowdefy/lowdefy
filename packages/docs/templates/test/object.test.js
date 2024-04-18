/*
  Copyright 2020-2024 Lowdefy, Inc

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
    Array [
      Object {
        "blocks": Array [
          Object {
            "id": "block.properties.field.num",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
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
          Object {
            "id": "block.properties.field.str",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
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
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "bodyStyle": Object {
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
    Object {
      "_object.assign": Array [
        Object {
          "_state": Object {
            "contextId": "Block:Block:{}",
            "default": Object {},
            "key": "block.properties",
          },
        },
        Object {
          "field": Object {
            "_object.assign": Array [
              Object {
                "_state": Object {
                  "contextId": "Block:Block:{}",
                  "default": Object {},
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
    Object {
      "field": Object {
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
    Object {
      "field": Object {
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
    Array [
      Object {
        "blocks": Array [
          Object {
            "id": "block.properties.field.bool",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
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
          Object {
            "id": "block.properties.field.num",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
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
          Object {
            "blocks": Array [
              Object {
                "id": "block.properties.field.obj.str",
                "layout": Object {
                  "_global": "settings_input_layout",
                },
                "properties": Object {
                  "label": Object {
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
            "layout": Object {
              "contentGutter": 0,
            },
            "properties": Object {
              "bodyStyle": Object {
                "padding": 0,
              },
              "size": "small",
              "title": "obj:",
            },
            "type": "Card",
          },
          Object {
            "id": "block.properties.field.str",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
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
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "bodyStyle": Object {
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
    Object {
      "_object.assign": Array [
        Object {
          "_state": Object {
            "contextId": "Block:Block:{}",
            "default": Object {},
            "key": "block.properties",
          },
        },
        Object {
          "field": Object {
            "_object.assign": Array [
              Object {
                "_state": Object {
                  "contextId": "Block:Block:{}",
                  "default": Object {},
                  "key": "block.properties.field",
                },
              },
              Object {
                "obj": Object {
                  "_object.assign": Array [
                    Object {
                      "_state": Object {
                        "contextId": "Block:Block:{}",
                        "default": Object {},
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
    Object {
      "field": Object {
        "bool": true,
        "num": 1,
        "obj": Object {
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
    Object {
      "field": Object {
        "bool": true,
        "num": 1,
        "obj": Object {
          "str": "a",
        },
        "str": null,
      },
    }
  `);
});
