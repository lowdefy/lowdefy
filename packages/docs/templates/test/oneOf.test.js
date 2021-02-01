import propertiesFormTransformer from '../blocks/propertiesFormTransformer';
import propertiesGetterTransformer from '../blocks/propertiesGetterTransformer';
import defaultValueTransformer from '../blocks/defaultValueTransformer';

const schema = {
  schema: {
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
                "id": "__field_number",
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
                          "_state": "__field_type",
                        },
                        "number",
                      ],
                    },
                    "then": true,
                  },
                },
              },
              Object {
                "id": "__field_string",
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
                          "_state": "__field_type",
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
                "id": "__field_type",
                "properties": Object {
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
        "bodyStyle": Object {
          "padding": 0,
        },
        "id": "field",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "bodyStyle": Object {
            "padding": 0,
          },
          "inner": true,
          "size": "small",
          "title": "field - type options:",
        },
        "type": "Card",
      },
    ]
  `);
});

test('oneOf propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": "block.properties",
        },
        Object {
          "field": Object {
            "_state": Object {
              "_string.concat": Array [
                "__field_",
                Object {
                  "_state": "__field_type",
                },
              ],
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
    schema: {
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
  schema: {
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
                "id": "__field_string",
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
                          "_state": "__field_type",
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
                    "id": "__field_object.bool",
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
                    "id": "__field_object.str",
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
                "id": "__field_object",
                "layout": Object {
                  "contentGutter": 0,
                },
                "properties": Object {
                  "bodyStyle": Object {
                    "padding": 0,
                  },
                  "inner": true,
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
                          "_state": "__field_type",
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
                "id": "__field_type",
                "properties": Object {
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
        "bodyStyle": Object {
          "padding": 0,
        },
        "id": "field",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "bodyStyle": Object {
            "padding": 0,
          },
          "inner": true,
          "size": "small",
          "title": "field - type options:",
        },
        "type": "Card",
      },
    ]
  `);
});

test('oneOf schemaStrObj propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaStrObj)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": "block.properties",
        },
        Object {
          "field": Object {
            "_state": Object {
              "_string.concat": Array [
                "__field_",
                Object {
                  "_state": "__field_type",
                },
              ],
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
    schema: {
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
