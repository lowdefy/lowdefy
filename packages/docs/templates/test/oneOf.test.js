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
        oneOf: [
          {
            type: 'number',
            description: 'number description',
          },
          {
            type: 'string',
            description: 'string description',
          },
        ],
      },
    },
  },
};

test('oneOf propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    [
      {
        "id": "field",
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
          "title": "Select field type",
        },
        "slots": {
          "content": {
            "blocks": [
              {
                "id": "__number_block.properties.field",
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
                  "title": "field",
                },
                "required": false,
                "type": "NumberInput",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.field",
                        },
                        "number",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              {
                "id": "__string_block.properties.field",
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
                  "title": "field",
                },
                "required": false,
                "type": "TextInput",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.field",
                        },
                        "string",
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
                "id": "__type_block.properties.field",
                "properties": {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": {
                    "disabled": true,
                  },
                  "options": [
                    "number",
                    "string",
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

test('oneOf propertiesGetterTransformer', () => {
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
            "_mql.expr": {
              "expr": {
                "$switch": {
                  "branches": [
                    {
                      "case": {
                        "_eq": [
                          {
                            "_state": "__type_block.properties.field",
                          },
                          "number",
                        ],
                      },
                      "then": {
                        "_state": {
                          "contextId": "Block:Block:{}",
                          "key": "__number_block.properties.field",
                        },
                      },
                    },
                    {
                      "case": {
                        "_eq": [
                          {
                            "_state": "__type_block.properties.field",
                          },
                          "string",
                        ],
                      },
                      "then": {
                        "_state": {
                          "contextId": "Block:Block:{}",
                          "key": "__string_block.properties.field",
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

test('oneOf defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    {
      "field": null,
    }
  `);
  const schemaDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        field: {
          default: 1,
          oneOf: [
            {
              type: 'number',
              description: 'number description',
            },
            {
              type: 'string',
              description: 'string description',
            },
          ],
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "field": 1,
    }
  `);
});

// for string object
const schemaStrObj = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      field: {
        oneOf: [
          {
            type: 'string',
            description: 'string description',
          },
          {
            type: 'object',
            description: 'object description',
            properties: {
              str: {
                type: 'string',
                description: 'str description',
              },
              bool: {
                type: 'boolean',
                description: 'bool description',
              },
            },
          },
        ],
      },
    },
  },
};

test('oneOf schemaStrObj propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaStrObj)).toMatchInlineSnapshot(`
    [
      {
        "id": "field",
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
          "title": "Select field type",
        },
        "slots": {
          "content": {
            "blocks": [
              {
                "id": "__string_block.properties.field",
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
                  "title": "field",
                },
                "required": false,
                "type": "TextInput",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.field",
                        },
                        "string",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              {
                "blocks": [
                  {
                    "id": "__object_block.properties.field.bool",
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
                    "id": "__object_block.properties.field.str",
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
                "id": "__object_block.properties.field",
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
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.field",
                        },
                        "object",
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
                "id": "__type_block.properties.field",
                "properties": {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": {
                    "disabled": true,
                  },
                  "options": [
                    "string",
                    "object",
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

test('oneOf schemaStrObj propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaStrObj, { block_type: 'Block' })).toMatchInlineSnapshot(`
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
            "_mql.expr": {
              "expr": {
                "$switch": {
                  "branches": [
                    {
                      "case": {
                        "_eq": [
                          {
                            "_state": "__type_block.properties.field",
                          },
                          "string",
                        ],
                      },
                      "then": {
                        "_state": {
                          "contextId": "Block:Block:{}",
                          "key": "__string_block.properties.field",
                        },
                      },
                    },
                    {
                      "case": {
                        "_eq": [
                          {
                            "_state": "__type_block.properties.field",
                          },
                          "object",
                        ],
                      },
                      "then": {
                        "_object.assign": [
                          {
                            "_state": {
                              "contextId": "Block:Block:{}",
                              "default": {},
                              "key": "__object_block.properties.field",
                            },
                          },
                        ],
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

test('oneOf schemaStrObj defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaStrObj)).toMatchInlineSnapshot(`
    {
      "field": null,
    }
  `);
  const schemaDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        field: {
          default: {
            str: 'x',
          },
          oneOf: [
            {
              type: 'string',
              description: 'string description',
            },
            {
              type: 'object',
              description: 'object description',
              properties: {
                str: {
                  type: 'string',
                  description: 'str description',
                },
                bool: {
                  type: 'boolean',
                  description: 'bool description',
                },
              },
            },
          ],
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "field": {
        "str": "x",
      },
    }
  `);
});

const schemaOneOfStrYaml = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      field: {
        oneOf: [
          {
            type: 'string',
            description: 'string description',
          },
          {
            type: 'object',
            description: 'object description',
            docs: {
              displayType: 'yaml',
            },
          },
        ],
      },
    },
  },
};

test('oneOf propertiesFormTransformer schemaOneOfStrYaml', () => {
  expect(propertiesFormTransformer(schemaOneOfStrYaml)).toMatchInlineSnapshot(`
    [
      {
        "id": "field",
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
          "title": "Select field type",
        },
        "slots": {
          "content": {
            "blocks": [
              {
                "id": "__string_block.properties.field",
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
                  "title": "field",
                },
                "required": false,
                "type": "TextInput",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.field",
                        },
                        "string",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              {
                "id": "__object_block.properties.field",
                "layout": {
                  "_global": "settings_input_layout",
                },
                "properties": {
                  "autoSize": {
                    "minRows": 2,
                  },
                  "label": {
                    "align": "right",
                    "extra": "object description",
                    "span": 8,
                  },
                  "placeholder": "Type YAML here",
                  "size": "small",
                  "title": "field",
                },
                "required": false,
                "type": "TextArea",
                "visible": {
                  "_if": {
                    "else": false,
                    "test": {
                      "_eq": [
                        {
                          "_state": "__type_block.properties.field",
                        },
                        "object",
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
                "id": "__type_block.properties.field",
                "properties": {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": {
                    "disabled": true,
                  },
                  "options": [
                    "string",
                    "object",
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

test('oneOf propertiesGetterTransformer schemaOneOfStrYaml', () => {
  expect(propertiesGetterTransformer(schemaOneOfStrYaml, { block_type: 'Block' }))
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
            "field": {
              "_mql.expr": {
                "expr": {
                  "$switch": {
                    "branches": [
                      {
                        "case": {
                          "_eq": [
                            {
                              "_state": "__type_block.properties.field",
                            },
                            "string",
                          ],
                        },
                        "then": {
                          "_state": {
                            "contextId": "Block:Block:{}",
                            "key": "__string_block.properties.field",
                          },
                        },
                      },
                      {
                        "case": {
                          "_eq": [
                            {
                              "_state": "__type_block.properties.field",
                            },
                            "object",
                          ],
                        },
                        "then": {
                          "_yaml.parse": [
                            {
                              "_if_none": [
                                {
                                  "_state": {
                                    "contextId": "Block:Block:{}",
                                    "key": "__object_block.properties.field",
                                  },
                                },
                                "",
                              ],
                            },
                          ],
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

test('oneOf defaultValueTransformer schemaOneOfStrYaml', () => {
  expect(defaultValueTransformer(schemaOneOfStrYaml)).toMatchInlineSnapshot(`
    {
      "field": null,
    }
  `);
  const schemaOneOfStrYamlDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        field: {
          default: 'str',
          oneOf: [
            {
              type: 'number',
              description: 'number description',
            },
            {
              type: 'object',
              description: 'object description',
              docs: {
                displayType: 'yaml',
              },
            },
          ],
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaOneOfStrYamlDV)).toMatchInlineSnapshot(`
    {
      "field": "str",
    }
  `);
});
