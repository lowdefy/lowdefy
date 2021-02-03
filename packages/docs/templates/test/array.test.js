import propertiesFormTransformer from '../blocks/propertiesFormTransformer';
import propertiesGetterTransformer from '../blocks/propertiesGetterTransformer';
import defaultValueTransformer from '../blocks/defaultValueTransformer';

const schema = {
  schema: {
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
  expect(propertiesGetterTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": "block.properties",
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
    schema: {
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
  schema: {
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
              "title": false,
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
  expect(propertiesGetterTransformer(schemaArrayObject)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": "block.properties",
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
    schema: {
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
  schema: {
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
  expect(propertiesGetterTransformer(schemaOneOfPrimitive)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": "block.properties",
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
    schema: {
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
  schema: {
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
  expect(propertiesGetterTransformer(schemaPrimitiveOneOf)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": "block.properties",
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
    schema: {
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
