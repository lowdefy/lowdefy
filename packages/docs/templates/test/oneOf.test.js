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
    Array [
      Object {
        "areas": Object {
          "content": Object {
            "blocks": Array [
              Object {
                "id": "__number_block.properties.field",
                "layout": Object {
                  "_global": "settings_input_layout",
                },
                "properties": Object {
                  "label": Object {
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
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
                          "_state": "__type_block.properties.field",
                        },
                        "number",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              Object {
                "id": "__string_block.properties.field",
                "layout": Object {
                  "_global": "settings_input_layout",
                },
                "properties": Object {
                  "label": Object {
                    "align": "right",
                    "extra": "string description",
                    "span": 8,
                  },
                  "size": "small",
                  "title": "field",
                },
                "required": false,
                "type": "TextInput",
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
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
          "extra": Object {
            "blocks": Array [
              Object {
                "id": "__type_block.properties.field",
                "properties": Object {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": Object {
                    "disabled": true,
                  },
                  "options": Array [
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
        "id": "field",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "bodyStyle": Object {
            "padding": 0,
          },
          "headerStyle": Object {
            "background": "rgba(0, 0, 0, 0.06)",
            "color": "rgba(0, 0, 0, 0.45)",
          },
          "inner": true,
          "size": "small",
          "title": "Select field type",
        },
        "type": "Card",
      },
    ]
  `);
});

test('oneOf propertiesGetterTransformer', () => {
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
            "_mql.expr": Object {
              "expr": Object {
                "$switch": Object {
                  "branches": Array [
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.field",
                          },
                          "number",
                        ],
                      },
                      "then": Object {
                        "_state": Object {
                          "contextId": "Block:Block:{}",
                          "key": "__number_block.properties.field",
                        },
                      },
                    },
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.field",
                          },
                          "string",
                        ],
                      },
                      "then": Object {
                        "_state": Object {
                          "contextId": "Block:Block:{}",
                          "key": "__string_block.properties.field",
                        },
                      },
                    },
                  ],
                  "default": null,
                },
              },
              "on": Object {},
            },
          },
        },
      ],
    }
  `);
});

test('oneOf defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    Object {
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
    Object {
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
    Array [
      Object {
        "areas": Object {
          "content": Object {
            "blocks": Array [
              Object {
                "id": "__string_block.properties.field",
                "layout": Object {
                  "_global": "settings_input_layout",
                },
                "properties": Object {
                  "label": Object {
                    "align": "right",
                    "extra": "string description",
                    "span": 8,
                  },
                  "size": "small",
                  "title": "field",
                },
                "required": false,
                "type": "TextInput",
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
                          "_state": "__type_block.properties.field",
                        },
                        "string",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              Object {
                "blocks": Array [
                  Object {
                    "id": "__object_block.properties.field.bool",
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
                    "id": "__object_block.properties.field.str",
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
                "id": "__object_block.properties.field",
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
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
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
          "extra": Object {
            "blocks": Array [
              Object {
                "id": "__type_block.properties.field",
                "properties": Object {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": Object {
                    "disabled": true,
                  },
                  "options": Array [
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
        "id": "field",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "bodyStyle": Object {
            "padding": 0,
          },
          "headerStyle": Object {
            "background": "rgba(0, 0, 0, 0.06)",
            "color": "rgba(0, 0, 0, 0.45)",
          },
          "inner": true,
          "size": "small",
          "title": "Select field type",
        },
        "type": "Card",
      },
    ]
  `);
});

test('oneOf schemaStrObj propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaStrObj, { block_type: 'Block' })).toMatchInlineSnapshot(`
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
            "_mql.expr": Object {
              "expr": Object {
                "$switch": Object {
                  "branches": Array [
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.field",
                          },
                          "string",
                        ],
                      },
                      "then": Object {
                        "_state": Object {
                          "contextId": "Block:Block:{}",
                          "key": "__string_block.properties.field",
                        },
                      },
                    },
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.field",
                          },
                          "object",
                        ],
                      },
                      "then": Object {
                        "_object.assign": Array [
                          Object {
                            "_state": Object {
                              "contextId": "Block:Block:{}",
                              "default": Object {},
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
              "on": Object {},
            },
          },
        },
      ],
    }
  `);
});

test('oneOf schemaStrObj defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaStrObj)).toMatchInlineSnapshot(`
    Object {
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
    Object {
      "field": Object {
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
    Array [
      Object {
        "areas": Object {
          "content": Object {
            "blocks": Array [
              Object {
                "id": "__string_block.properties.field",
                "layout": Object {
                  "_global": "settings_input_layout",
                },
                "properties": Object {
                  "label": Object {
                    "align": "right",
                    "extra": "string description",
                    "span": 8,
                  },
                  "size": "small",
                  "title": "field",
                },
                "required": false,
                "type": "TextInput",
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
                          "_state": "__type_block.properties.field",
                        },
                        "string",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              Object {
                "id": "__object_block.properties.field",
                "layout": Object {
                  "_global": "settings_input_layout",
                },
                "properties": Object {
                  "autoSize": Object {
                    "minRows": 2,
                  },
                  "label": Object {
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
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
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
          "extra": Object {
            "blocks": Array [
              Object {
                "id": "__type_block.properties.field",
                "properties": Object {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": Object {
                    "disabled": true,
                  },
                  "options": Array [
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
        "id": "field",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "bodyStyle": Object {
            "padding": 0,
          },
          "headerStyle": Object {
            "background": "rgba(0, 0, 0, 0.06)",
            "color": "rgba(0, 0, 0, 0.45)",
          },
          "inner": true,
          "size": "small",
          "title": "Select field type",
        },
        "type": "Card",
      },
    ]
  `);
});

test('oneOf propertiesGetterTransformer schemaOneOfStrYaml', () => {
  expect(propertiesGetterTransformer(schemaOneOfStrYaml, { block_type: 'Block' }))
    .toMatchInlineSnapshot(`
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
            "_mql.expr": Object {
              "expr": Object {
                "$switch": Object {
                  "branches": Array [
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.field",
                          },
                          "string",
                        ],
                      },
                      "then": Object {
                        "_state": Object {
                          "contextId": "Block:Block:{}",
                          "key": "__string_block.properties.field",
                        },
                      },
                    },
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.field",
                          },
                          "object",
                        ],
                      },
                      "then": Object {
                        "_yaml.parse": Array [
                          Object {
                            "_if_none": Array [
                              Object {
                                "_state": Object {
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
              "on": Object {},
            },
          },
        },
      ],
    }
  `);
});

test('oneOf defaultValueTransformer schemaOneOfStrYaml', () => {
  expect(defaultValueTransformer(schemaOneOfStrYaml)).toMatchInlineSnapshot(`
    Object {
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
    Object {
      "field": "str",
    }
  `);
});
