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
    Array [
      Object {
        "blocks": Array [
          Object {
            "id": "block.properties.options.$",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
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
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "itemStyle": Object {
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
    Object {
      "_object.assign": Array [
        Object {
          "_state": Object {
            "contextId": "Block:Block:{}",
            "default": Object {},
            "key": "block.properties",
          },
        },
      ],
    }
  `);
});

test('array defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "options": Array [],
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
    Object {
      "options": Array [
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
    Array [
      Object {
        "blocks": Array [
          Object {
            "blocks": Array [
              Object {
                "id": "block.properties.options.$.num",
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
                  "title": "num",
                },
                "required": false,
                "type": "NumberInput",
              },
              Object {
                "id": "block.properties.options.$.str",
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
                  "title": "str",
                },
                "required": false,
                "type": "TextInput",
              },
            ],
            "id": "block.properties.options.$",
            "layout": Object {
              "contentGutter": 0,
            },
            "properties": Object {
              "bodyStyle": Object {
                "padding": 0,
              },
              "size": "small",
              "title": undefined,
            },
            "type": "Card",
          },
        ],
        "id": "block.properties.options",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "itemStyle": Object {
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
          "options": Object {
            "_array.map": Object {
              "callback": Object {
                "_function": Object {
                  "__object.assign": Array [
                    Object {
                      "__args": Object {
                        "contextId": undefined,
                        "default": Object {},
                        "key": "0",
                      },
                    },
                  ],
                },
              },
              "on": Object {
                "_if_none": Array [
                  Object {
                    "_state": Object {
                      "contextId": "Block:Block:{}",
                      "key": "block.properties.options",
                    },
                  },
                  Array [],
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
    Object {
      "options": Array [],
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
    Object {
      "options": Array [
        Object {
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
    Array [
      Object {
        "blocks": Array [
          Object {
            "areas": Object {
              "content": Object {
                "blocks": Array [
                  Object {
                    "id": "__string_block.properties.options.$",
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
                      "title": "$",
                    },
                    "required": false,
                    "type": "TextInput",
                    "visible": Object {
                      "_if": Object {
                        "else": false,
                        "test": Object {
                          "_eq": Array [
                            Object {
                              "_state": "__type_block.properties.options.$",
                            },
                            "string",
                          ],
                        },
                        "then": true,
                      },
                    },
                  },
                  Object {
                    "id": "__number_block.properties.options.$",
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
                      "title": "$",
                    },
                    "required": false,
                    "type": "NumberInput",
                    "visible": Object {
                      "_if": Object {
                        "else": false,
                        "test": Object {
                          "_eq": Array [
                            Object {
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
              "extra": Object {
                "blocks": Array [
                  Object {
                    "id": "__type_block.properties.options.$",
                    "properties": Object {
                      "buttonStyle": "outlined",
                      "color": "rgba(0, 0, 0, 0.1)",
                      "label": Object {
                        "disabled": true,
                      },
                      "options": Array [
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
            "id": "$",
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
              "title": "Select $ type",
            },
            "type": "Card",
          },
        ],
        "id": "block.properties.options",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "itemStyle": Object {
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
          "options": Object {
            "_array.map": Object {
              "callback": Object {
                "_function": Object {
                  "_mql.expr": Object {
                    "expr": Object {
                      "$switch": Object {
                        "branches": Array [
                          Object {
                            "case": Object {
                              "_eq": Array [
                                Object {
                                  "_state": "__type_0",
                                },
                                "string",
                              ],
                            },
                            "then": Object {
                              "_state": Object {
                                "contextId": undefined,
                                "key": "__string_0",
                              },
                            },
                          },
                          Object {
                            "case": Object {
                              "_eq": Array [
                                Object {
                                  "_state": "__type_0",
                                },
                                "number",
                              ],
                            },
                            "then": Object {
                              "_state": Object {
                                "contextId": undefined,
                                "key": "__number_0",
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
              "on": Object {
                "_if_none": Array [
                  Object {
                    "_state": Object {
                      "contextId": "Block:Block:{}",
                      "key": "block.properties.options",
                    },
                  },
                  Array [],
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
    Object {
      "options": Array [],
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
    Object {
      "options": Array [
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
    Array [
      Object {
        "areas": Object {
          "content": Object {
            "blocks": Array [
              Object {
                "blocks": Array [
                  Object {
                    "id": "__string_arr_block.properties.options.$",
                    "layout": Object {
                      "_global": "settings_input_layout",
                    },
                    "properties": Object {
                      "label": Object {
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
                "layout": Object {
                  "contentGutter": 0,
                },
                "properties": Object {
                  "itemStyle": Object {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "options:",
                },
                "type": "ControlledList",
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
                          "_state": "__type_block.properties.options",
                        },
                        "string[]",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              Object {
                "blocks": Array [
                  Object {
                    "id": "__number_arr_block.properties.options.$",
                    "layout": Object {
                      "_global": "settings_input_layout",
                    },
                    "properties": Object {
                      "label": Object {
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
                "layout": Object {
                  "contentGutter": 0,
                },
                "properties": Object {
                  "itemStyle": Object {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "options:",
                },
                "type": "ControlledList",
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
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
          "extra": Object {
            "blocks": Array [
              Object {
                "id": "__type_block.properties.options",
                "properties": Object {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": Object {
                    "disabled": true,
                  },
                  "options": Array [
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
        "id": "options",
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
          "title": "Select options type",
        },
        "type": "Card",
      },
    ]
  `);
});

test('array schemaPrimitiveOneOf propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaPrimitiveOneOf, { block_type: 'Block' }))
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
          "options": Object {
            "_mql.expr": Object {
              "expr": Object {
                "$switch": Object {
                  "branches": Array [
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.options",
                          },
                          "string[]",
                        ],
                      },
                      "then": Object {
                        "_state": Object {
                          "contextId": "Block:Block:{}",
                          "key": "__string_arr_block.properties.options",
                        },
                      },
                    },
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.options",
                          },
                          "number[]",
                        ],
                      },
                      "then": Object {
                        "_state": Object {
                          "contextId": "Block:Block:{}",
                          "key": "__number_arr_block.properties.options",
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

test('array schemaPrimitiveOneOf defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaPrimitiveOneOf)).toMatchInlineSnapshot(`
    Object {
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
    Object {
      "options": Array [
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
    Array [
      Object {
        "areas": Object {
          "content": Object {
            "blocks": Array [
              Object {
                "blocks": Array [
                  Object {
                    "id": "__string_arr_block.properties.options.$",
                    "layout": Object {
                      "_global": "settings_input_layout",
                    },
                    "properties": Object {
                      "label": Object {
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
                "layout": Object {
                  "contentGutter": 0,
                },
                "properties": Object {
                  "itemStyle": Object {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "options:",
                },
                "type": "ControlledList",
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
                          "_state": "__type_block.properties.options",
                        },
                        "string[]",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              Object {
                "blocks": Array [
                  Object {
                    "id": "__object_arr_block.properties.options.$",
                    "layout": Object {
                      "_global": "settings_input_layout",
                    },
                    "properties": Object {
                      "autoSize": Object {
                        "minRows": 2,
                      },
                      "label": Object {
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
                "layout": Object {
                  "contentGutter": 0,
                },
                "properties": Object {
                  "itemStyle": Object {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "options:",
                },
                "type": "ControlledList",
                "visible": Object {
                  "_if": Object {
                    "else": false,
                    "test": Object {
                      "_eq": Array [
                        Object {
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
          "extra": Object {
            "blocks": Array [
              Object {
                "id": "__type_block.properties.options",
                "properties": Object {
                  "buttonStyle": "outlined",
                  "color": "rgba(0, 0, 0, 0.1)",
                  "label": Object {
                    "disabled": true,
                  },
                  "options": Array [
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
        "id": "options",
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
          "title": "Select options type",
        },
        "type": "Card",
      },
    ]
  `);
});

test('array schemaOneOfArrayStrArrayYaml propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaOneOfArrayStrArrayYaml, { block_type: 'Block' }))
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
          "options": Object {
            "_mql.expr": Object {
              "expr": Object {
                "$switch": Object {
                  "branches": Array [
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.options",
                          },
                          "string[]",
                        ],
                      },
                      "then": Object {
                        "_state": Object {
                          "contextId": "Block:Block:{}",
                          "key": "__string_arr_block.properties.options",
                        },
                      },
                    },
                    Object {
                      "case": Object {
                        "_eq": Array [
                          Object {
                            "_state": "__type_block.properties.options",
                          },
                          "object[]",
                        ],
                      },
                      "then": Object {
                        "_array.map": Object {
                          "callback": Object {
                            "_function": Object {
                              "__yaml.parse": Array [
                                Object {
                                  "__if_none": Array [
                                    Object {
                                      "__args": Object {
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
                          "on": Object {
                            "_if_none": Array [
                              Object {
                                "_state": Object {
                                  "contextId": "Block:Block:{}",
                                  "key": "__object_arr_block.properties.options",
                                },
                              },
                              Array [],
                            ],
                          },
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
    Array [
      Object {
        "blocks": Array [
          Object {
            "blocks": Array [
              Object {
                "blocks": Array [
                  Object {
                    "id": "block.properties.arr1.$.arr2.$",
                    "layout": Object {
                      "_global": "settings_input_layout",
                    },
                    "properties": Object {
                      "autoSize": Object {
                        "minRows": 2,
                      },
                      "label": Object {
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
                "layout": Object {
                  "contentGutter": 0,
                },
                "properties": Object {
                  "itemStyle": Object {
                    "padding": 0,
                  },
                  "size": "small",
                  "title": "arr2:",
                },
                "type": "ControlledList",
              },
              Object {
                "id": "block.properties.arr1.$.obj",
                "layout": Object {
                  "_global": "settings_input_layout",
                },
                "properties": Object {
                  "autoSize": Object {
                    "minRows": 2,
                  },
                  "label": Object {
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
            "layout": Object {
              "contentGutter": 0,
            },
            "properties": Object {
              "bodyStyle": Object {
                "padding": 0,
              },
              "size": "small",
              "title": undefined,
            },
            "type": "Card",
          },
        ],
        "id": "block.properties.arr1",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "itemStyle": Object {
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
          "arr1": Object {
            "_array.map": Object {
              "callback": Object {
                "_function": Object {
                  "__object.assign": Array [
                    Object {
                      "__args": Object {
                        "contextId": undefined,
                        "default": Object {},
                        "key": "0",
                      },
                    },
                    Object {
                      "obj": Object {
                        "__yaml.parse": Array [
                          Object {
                            "__if_none": Array [
                              Object {
                                "__args": Object {
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
                    Object {
                      "arr2": Object {
                        "__array.map": Object {
                          "callback": Object {
                            "__function": Object {
                              "___yaml.parse": Array [
                                Object {
                                  "___if_none": Array [
                                    Object {
                                      "___args": Object {
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
                          "on": Object {
                            "__if_none": Array [
                              Object {
                                "__args": Object {
                                  "contextId": undefined,
                                  "key": "0.arr2",
                                },
                              },
                              Array [],
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
              "on": Object {
                "_if_none": Array [
                  Object {
                    "_state": Object {
                      "contextId": "Block:Block:{}",
                      "key": "block.properties.arr1",
                    },
                  },
                  Array [],
                ],
              },
            },
          },
        },
      ],
    }
  `);
});
