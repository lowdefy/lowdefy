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
    properties: {
      options: {
        type: 'array',
        items: {
          type: 'string',
          description: 'string description',
        },
      },
    },
  },
};

test('array propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "id": "block.properties.options.$",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "label": {
                "disabled": true,
              },
              "size": "small",
              "title": "$",
            },
            "required": false,
            "type": "TextInput",
          },
        ],
        "id": "block.properties.options",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "itemStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "options:",
        },
        "type": "ControlledList",
      },
    ]
  `);
});

test('array propertiesGetterTransformer', () => {
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

test('array defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    {
      "options": [],
    }
  `);
  const schemaDV = {
    properties: {
      type: 'object',
      properties: {
        options: {
          type: 'array',
          default: ['a'],
          items: {
            type: 'string',
            description: 'string description',
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "options": [
        "a",
      ],
    }
  `);
});

const schemaArrayObject = {
  properties: {
    type: 'object',
    properties: {
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            str: {
              type: 'string',
              description: 'string description',
            },
            num: {
              type: 'number',
              description: 'number description',
            },
          },
        },
      },
    },
  },
};

test('array schemaArrayObject propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaArrayObject)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "blocks": [
              {
                "id": "block.properties.options.$.num",
                "layout": {
                  "_global": "settings_input_layout",
                },
                "properties": {
                  "label": {
                    "align": "right",
                    "extra": "number description",
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
                "id": "block.properties.options.$.str",
                "layout": {
                  "_global": "settings_input_layout",
                },
                "properties": {
                  "label": {
                    "align": "right",
                    "extra": "string description",
                    "span": 8,
                  },
                  "size": "small",
                  "title": "str",
                },
                "required": false,
                "type": "TextInput",
              },
            ],
            "id": "block.properties.options.$",
            "layout": {
              "gap": 0,
            },
            "properties": {
              "bodyStyle": {
                "padding": 0,
              },
              "size": "small",
              "title": undefined,
            },
            "type": "Card",
          },
        ],
        "id": "block.properties.options",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "itemStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "options:",
        },
        "type": "ControlledList",
      },
    ]
  `);
});

test('array schemaArrayObject propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaArrayObject, { block_type: 'Block' }))
    .toMatchInlineSnapshot(`
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
            "options": {
              "_array.map": {
                "callback": {
                  "_function": {
                    "__object.assign": [
                      {
                        "__args": {
                          "contextId": undefined,
                          "default": {},
                          "key": "0",
                        },
                      },
                    ],
                  },
                },
                "on": {
                  "_if_none": [
                    {
                      "_state": {
                        "contextId": "Block:Block:{}",
                        "key": "block.properties.options",
                      },
                    },
                    [],
                  ],
                },
              },
            },
          },
        ],
      }
    `);
});

test('array schemaArrayObject defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaArrayObject)).toMatchInlineSnapshot(`
    {
      "options": [],
    }
  `);
  const schemaArrayObjectDV = {
    properties: {
      type: 'object',
      properties: {
        options: {
          type: 'array',
          default: [{ str: 'a' }],
          items: {
            type: 'object',
            properties: {
              str: {
                type: 'string',
                description: 'string description',
              },
              num: {
                type: 'number',
                description: 'numebr description',
              },
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaArrayObjectDV)).toMatchInlineSnapshot(`
    {
      "options": [
        {
          "str": "a",
        },
      ],
    }
  `);
});

const schemaOneOfPrimitive = {
  properties: {
    type: 'object',
    properties: {
      options: {
        type: 'array',
        items: {
          oneOf: [
            {
              type: 'string',
              description: 'string description',
            },
            {
              type: 'number',
              description: 'number description',
            },
          ],
        },
      },
    },
  },
};

test('array schemaOneOfPrimitive propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaOneOfPrimitive)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "id": "$",
            "layout": {
              "gap": 0,
            },
            "properties": {
              "bodyStyle": {
                "padding": 0,
              },
              "headerStyle": {
                "background": "rgba(0, 0, 0, 0.06)",
                "color": "rgba(0, 0, 0, 0.45)",
              },
              "inner": true,
              "size": "small",
              "title": "Select $ type",
            },
            "slots": {
              "content": {
                "blocks": [
                  {
                    "id": "__string_block.properties.options.$",
                    "layout": {
                      "_global": "settings_input_layout",
                    },
                    "properties": {
                      "label": {
                        "align": "right",
                        "extra": "string description",
                        "span": 8,
                      },
                      "size": "small",
                      "title": "$",
                    },
                    "required": false,
                    "type": "TextInput",
                    "visible": {
                      "_if": {
                        "else": false,
                        "test": {
                          "_eq": [
                            {
                              "_state": "__type_block.properties.options.$",
                            },
                            "string",
                          ],
                        },
                        "then": true,
                      },
                    },
                  },
                  {
                    "id": "__number_block.properties.options.$",
                    "layout": {
                      "_global": "settings_input_layout",
                    },
                    "properties": {
                      "label": {
                        "align": "right",
                        "extra": "number description",
                        "span": 8,
                      },
                      "size": "small",
                      "step": 0.1,
                      "title": "$",
                    },
                    "required": false,
                    "type": "NumberInput",
                    "visible": {
                      "_if": {
                        "else": false,
                        "test": {
                          "_eq": [
                            {
                              "_state": "__type_block.properties.options.$",
                            },
                            "number",
                          ],
                        },
                        "then": true,
                      },
                    },
                  },
                ],
              },
              "extra": {
                "blocks": [
                  {
                    "id": "__type_block.properties.options.$",
                    "properties": {
                      "buttonStyle": "outlined",
                      "color": "rgba(0, 0, 0, 0.1)",
                      "label": {
                        "disabled": true,
                      },
                      "options": [
                        "string",
                        "number",
                      ],
                      "size": "small",
                    },
                    "type": "ButtonSelector",
                  },
                ],
              },
            },
            "type": "Card",
          },
        ],
        "id": "block.properties.options",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "itemStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "options:",
        },
        "type": "ControlledList",
      },
    ]
  `);
});

test('array schemaOneOfPrimitive propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaOneOfPrimitive, { block_type: 'Block' }))
    .toMatchInlineSnapshot(`
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
            "options": {
              "_array.map": {
                "callback": {
                  "_function": {
                    "_mql.expr": {
                      "expr": {
                        "$switch": {
                          "branches": [
                            {
                              "case": {
                                "_eq": [
                                  {
                                    "_state": "__type_0",
                                  },
                                  "string",
                                ],
                              },
                              "then": {
                                "_state": {
                                  "contextId": undefined,
                                  "key": "__string_0",
                                },
                              },
                            },
                            {
                              "case": {
                                "_eq": [
                                  {
                                    "_state": "__type_0",
                                  },
                                  "number",
                                ],
                              },
                              "then": {
                                "_state": {
                                  "contextId": undefined,
                                  "key": "__number_0",
                                },
                              },
                            },
                          ],
                          "default": null,
                        },
                      },
                      "on": {},
                    },
                  },
                },
                "on": {
                  "_if_none": [
                    {
                      "_state": {
                        "contextId": "Block:Block:{}",
                        "key": "block.properties.options",
                      },
                    },
                    [],
                  ],
                },
              },
            },
          },
        ],
      }
    `);
});

test('array schemaOneOfPrimitive defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaOneOfPrimitive)).toMatchInlineSnapshot(`
    {
      "options": [],
    }
  `);
  const schemaOneOfPrimitiveDV = {
    properties: {
      type: 'object',
      properties: {
        options: {
          type: 'array',
          default: ['a', 'b'],
          items: {
            oneOf: [
              {
                type: 'string',
                description: 'string description',
              },
              {
                type: 'number',
                description: 'number description',
              },
            ],
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaOneOfPrimitiveDV)).toMatchInlineSnapshot(`
    {
      "options": [
        "a",
        "b",
      ],
    }
  `);
});

const schemaPrimitiveOneOf = {
  properties: {
    type: 'object',
    properties: {
      options: {
        oneOf: [
          {
            type: 'array',
            items: {
              type: 'string',
              description: 'string description',
            },
          },
          {
            type: 'array',
            items: {
              type: 'number',
              description: 'number description',
            },
          },
        ],
      },
    },
  },
};

test('array schemaPrimitiveOneOf propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaPrimitiveOneOf)).toMatchInlineSnapshot(`
    [
      {
        "id": "options",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "bodyStyle": {
            "padding": 0,
          },
          "headerStyle": {
            "background": "rgba(0, 0, 0, 0.06)",
            "color": "rgba(0, 0, 0, 0.45)",
          },
          "inner": true,
          "size": "small",
          "title": "Select options type",
        },
        "slots": {
          "content": {
            "blocks": [
              {
                "blocks": [
                  {
                    "id": "__string_arr_block.properties.options.$",
                    "layout": {
                      "_global": "settings_input_layout",
                    },
                    "properties": {
                      "label": {
                        "disabled": true,
                      },
                      "size": "small",
                      "title": "$",
                    },
                    "required": false,
                    "type": "TextInput",
                  },
                ],
                "id": "__string_arr_block.properties.options",
                "layout": {
                  "gap": 0,
                },
                "properties": {
                  "itemStyle": {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "options:",
                },
                "type": "ControlledList",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.options",
                        },
                        "string[]",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              {
                "blocks": [
                  {
                    "id": "__number_arr_block.properties.options.$",
                    "layout": {
                      "_global": "settings_input_layout",
                    },
                    "properties": {
                      "label": {
                        "disabled": true,
                      },
                      "size": "small",
                      "step": 0.1,
                      "title": "$",
                    },
                    "required": false,
                    "type": "NumberInput",
                  },
                ],
                "id": "__number_arr_block.properties.options",
                "layout": {
                  "gap": 0,
                },
                "properties": {
                  "itemStyle": {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "options:",
                },
                "type": "ControlledList",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.options",
                        },
                        "number[]",
                      ],
                    },
                    "then": true,
                  },
                },
              },
            ],
          },
          "extra": {
            "blocks": [
              {
                "id": "__type_block.properties.options",
                "properties": {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": {
                    "disabled": true,
                  },
                  "options": [
                    "string[]",
                    "number[]",
                  ],
                  "size": "small",
                },
                "type": "ButtonSelector",
              },
            ],
          },
        },
        "type": "Card",
      },
    ]
  `);
});

test('array schemaPrimitiveOneOf propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaPrimitiveOneOf, { block_type: 'Block' }))
    .toMatchInlineSnapshot(`
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
            "options": {
              "_mql.expr": {
                "expr": {
                  "$switch": {
                    "branches": [
                      {
                        "case": {
                          "_eq": [
                            {
                              "_state": "__type_block.properties.options",
                            },
                            "string[]",
                          ],
                        },
                        "then": {
                          "_state": {
                            "contextId": "Block:Block:{}",
                            "key": "__string_arr_block.properties.options",
                          },
                        },
                      },
                      {
                        "case": {
                          "_eq": [
                            {
                              "_state": "__type_block.properties.options",
                            },
                            "number[]",
                          ],
                        },
                        "then": {
                          "_state": {
                            "contextId": "Block:Block:{}",
                            "key": "__number_arr_block.properties.options",
                          },
                        },
                      },
                    ],
                    "default": null,
                  },
                },
                "on": {},
              },
            },
          },
        ],
      }
    `);
});

test('array schemaPrimitiveOneOf defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaPrimitiveOneOf)).toMatchInlineSnapshot(`
    {
      "options": null,
    }
  `);
  const schemaPrimitiveOneOfDV = {
    properties: {
      type: 'object',
      properties: {
        options: {
          default: ['a', 'b'],
          oneOf: [
            {
              type: 'array',
              items: {
                type: 'string',
                description: 'string description',
              },
            },
            {
              type: 'array',
              items: {
                type: 'number',
                description: 'number description',
              },
            },
          ],
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaPrimitiveOneOfDV)).toMatchInlineSnapshot(`
    {
      "options": [
        "a",
        "b",
      ],
    }
  `);
});

const schemaOneOfArrayStrArrayYaml = {
  properties: {
    type: 'object',
    properties: {
      options: {
        oneOf: [
          {
            type: 'array',
            items: {
              type: 'string',
              description: 'string description',
            },
          },
          {
            type: 'array',
            items: {
              type: 'object',
              description: 'number description',
              docs: {
                displayType: 'yaml',
              },
            },
          },
        ],
      },
    },
  },
};

test('array schemaOneOfArrayStrArrayYaml propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaOneOfArrayStrArrayYaml)).toMatchInlineSnapshot(`
    [
      {
        "id": "options",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "bodyStyle": {
            "padding": 0,
          },
          "headerStyle": {
            "background": "rgba(0, 0, 0, 0.06)",
            "color": "rgba(0, 0, 0, 0.45)",
          },
          "inner": true,
          "size": "small",
          "title": "Select options type",
        },
        "slots": {
          "content": {
            "blocks": [
              {
                "blocks": [
                  {
                    "id": "__string_arr_block.properties.options.$",
                    "layout": {
                      "_global": "settings_input_layout",
                    },
                    "properties": {
                      "label": {
                        "disabled": true,
                      },
                      "size": "small",
                      "title": "$",
                    },
                    "required": false,
                    "type": "TextInput",
                  },
                ],
                "id": "__string_arr_block.properties.options",
                "layout": {
                  "gap": 0,
                },
                "properties": {
                  "itemStyle": {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "options:",
                },
                "type": "ControlledList",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.options",
                        },
                        "string[]",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              {
                "blocks": [
                  {
                    "id": "__object_arr_block.properties.options.$",
                    "layout": {
                      "_global": "settings_input_layout",
                    },
                    "properties": {
                      "autoSize": {
                        "minRows": 2,
                      },
                      "label": {
                        "disabled": true,
                      },
                      "placeholder": "Type YAML here",
                      "size": "small",
                      "title": "$",
                    },
                    "required": false,
                    "type": "TextArea",
                  },
                ],
                "id": "__object_arr_block.properties.options",
                "layout": {
                  "gap": 0,
                },
                "properties": {
                  "itemStyle": {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "options:",
                },
                "type": "ControlledList",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.options",
                        },
                        "object[]",
                      ],
                    },
                    "then": true,
                  },
                },
              },
            ],
          },
          "extra": {
            "blocks": [
              {
                "id": "__type_block.properties.options",
                "properties": {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": {
                    "disabled": true,
                  },
                  "options": [
                    "string[]",
                    "object[]",
                  ],
                  "size": "small",
                },
                "type": "ButtonSelector",
              },
            ],
          },
        },
        "type": "Card",
      },
    ]
  `);
});

test('array schemaOneOfArrayStrArrayYaml propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaOneOfArrayStrArrayYaml, { block_type: 'Block' }))
    .toMatchInlineSnapshot(`
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
            "options": {
              "_mql.expr": {
                "expr": {
                  "$switch": {
                    "branches": [
                      {
                        "case": {
                          "_eq": [
                            {
                              "_state": "__type_block.properties.options",
                            },
                            "string[]",
                          ],
                        },
                        "then": {
                          "_state": {
                            "contextId": "Block:Block:{}",
                            "key": "__string_arr_block.properties.options",
                          },
                        },
                      },
                      {
                        "case": {
                          "_eq": [
                            {
                              "_state": "__type_block.properties.options",
                            },
                            "object[]",
                          ],
                        },
                        "then": {
                          "_array.map": {
                            "callback": {
                              "_function": {
                                "__yaml.parse": [
                                  {
                                    "__if_none": [
                                      {
                                        "__args": {
                                          "contextId": undefined,
                                          "key": "0",
                                        },
                                      },
                                      "",
                                    ],
                                  },
                                ],
                              },
                            },
                            "on": {
                              "_if_none": [
                                {
                                  "_state": {
                                    "contextId": "Block:Block:{}",
                                    "key": "__object_arr_block.properties.options",
                                  },
                                },
                                [],
                              ],
                            },
                          },
                        },
                      },
                    ],
                    "default": null,
                  },
                },
                "on": {},
              },
            },
          },
        ],
      }
    `);
});

const schemaNestedArray = {
  properties: {
    type: 'object',
    properties: {
      arr1: {
        type: 'array',
        description: 'string description',
        items: {
          type: 'object',
          description: 'string description',
          properties: {
            obj: {
              type: 'object',
              docs: {
                displayType: 'yaml',
              },
            },
            arr2: {
              type: 'array',
              items: {
                type: 'object',
                docs: {
                  displayType: 'yaml',
                },
              },
            },
          },
        },
      },
    },
  },
};

test('array propertiesFormTransformer schemaNestedArray', () => {
  expect(propertiesFormTransformer(schemaNestedArray)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "blocks": [
              {
                "blocks": [
                  {
                    "id": "block.properties.arr1.$.arr2.$",
                    "layout": {
                      "_global": "settings_input_layout",
                    },
                    "properties": {
                      "autoSize": {
                        "minRows": 2,
                      },
                      "label": {
                        "disabled": true,
                      },
                      "placeholder": "Type YAML here",
                      "size": "small",
                      "title": "$",
                    },
                    "required": false,
                    "type": "TextArea",
                  },
                ],
                "id": "block.properties.arr1.$.arr2",
                "layout": {
                  "gap": 0,
                },
                "properties": {
                  "itemStyle": {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "arr2:",
                },
                "type": "ControlledList",
              },
              {
                "id": "block.properties.arr1.$.obj",
                "layout": {
                  "_global": "settings_input_layout",
                },
                "properties": {
                  "autoSize": {
                    "minRows": 2,
                  },
                  "label": {
                    "align": "right",
                    "extra": undefined,
                    "span": 8,
                  },
                  "placeholder": "Type YAML here",
                  "size": "small",
                  "title": "obj",
                },
                "required": false,
                "type": "TextArea",
              },
            ],
            "id": "block.properties.arr1.$",
            "layout": {
              "gap": 0,
            },
            "properties": {
              "bodyStyle": {
                "padding": 0,
              },
              "size": "small",
              "title": undefined,
            },
            "type": "Card",
          },
        ],
        "id": "block.properties.arr1",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "itemStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "arr1:",
        },
        "type": "ControlledList",
      },
    ]
  `);
});

test('array propertiesGetterTransformer schemaNestedArray', () => {
  expect(propertiesGetterTransformer(schemaNestedArray, { block_type: 'Block' }))
    .toMatchInlineSnapshot(`
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
            "arr1": {
              "_array.map": {
                "callback": {
                  "_function": {
                    "__object.assign": [
                      {
                        "__args": {
                          "contextId": undefined,
                          "default": {},
                          "key": "0",
                        },
                      },
                      {
                        "obj": {
                          "__yaml.parse": [
                            {
                              "__if_none": [
                                {
                                  "__args": {
                                    "contextId": undefined,
                                    "key": "0.obj",
                                  },
                                },
                                "",
                              ],
                            },
                          ],
                        },
                      },
                      {
                        "arr2": {
                          "__array.map": {
                            "callback": {
                              "__function": {
                                "___yaml.parse": [
                                  {
                                    "___if_none": [
                                      {
                                        "___args": {
                                          "contextId": undefined,
                                          "key": "0",
                                        },
                                      },
                                      "",
                                    ],
                                  },
                                ],
                              },
                            },
                            "on": {
                              "__if_none": [
                                {
                                  "__args": {
                                    "contextId": undefined,
                                    "key": "0.arr2",
                                  },
                                },
                                [],
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
                "on": {
                  "_if_none": [
                    {
                      "_state": {
                        "contextId": "Block:Block:{}",
                        "key": "block.properties.arr1",
                      },
                    },
                    [],
                  ],
                },
              },
            },
          },
        ],
      }
    `);
});
