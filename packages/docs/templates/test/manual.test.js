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
    Array [
      Object {
        "id": "manual",
        "type": "TestInput",
      },
    ]
  `);
});

test('manual propertiesGetterTransformer', () => {
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
            "a": 1,
          },
        },
      ],
    }
  `);
});

test('manual defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`Object {}`);
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
    Object {
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
    Array [
      Object {
        "blocks": Array [
          Object {
            "id": "manual",
            "type": "TestInput",
          },
        ],
        "id": "block.properties.obj",
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
    ]
  `);
});

test('manual schemaNested propertiesGetterTransformer', () => {
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
          "obj": Object {
            "_object.assign": Array [
              Object {
                "_state": Object {
                  "contextId": "Block:Block:{}",
                  "default": Object {},
                  "key": "block.properties.obj",
                },
              },
              Object {
                "field": Object {
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
  expect(defaultValueTransformer(schemaNested)).toMatchInlineSnapshot(`Object {}`);
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
    Object {
      "obj": Object {
        "field": Object {
          "a": 1,
        },
      },
    }
  `);
});
