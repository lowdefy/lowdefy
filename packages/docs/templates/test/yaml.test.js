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
          type: 'object',
          description: 'description',
          docs: {
            displayType: 'yaml',
          },
        },
      },
    },
  },
};

test('yaml propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    Array [
      Object {
        "id": "block.properties.field",
        "layout": Object {
          "_global": "settings_input_layout",
        },
        "properties": Object {
          "label": Object {
            "align": "right",
            "extra": "description",
            "span": 8,
          },
          "size": "small",
          "title": "field",
        },
        "required": false,
        "type": "TextArea",
      },
    ]
  `);
});

test('yaml propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": "block.properties",
        },
        Object {
          "field": Object {
            "_yaml.parse": Object {
              "_if_none": Array [
                Object {
                  "_state": "block.properties.field",
                },
                "",
              ],
            },
          },
        },
      ],
    }
  `);
});

test('yaml defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`Object {}`);
  const schemaDV = {
    schema: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          field: {
            type: 'object',
            default: 'value',
            description: 'description',
            docs: {
              displayType: 'yaml',
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
  schema: {
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
                displayType: 'yaml',
              },
            },
          },
        },
      },
    },
  },
};

test('yaml schemaNested propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaNested)).toMatchInlineSnapshot(`
    Array [
      Object {
        "blocks": Array [
          Object {
            "id": "block.properties.obj.field",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
                "align": "right",
                "extra": "field description",
                "span": 8,
              },
              "size": "small",
              "title": "field",
            },
            "required": false,
            "type": "TextArea",
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

test('yaml schemaNested propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaNested)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": "block.properties",
        },
        Object {
          "obj": Object {
            "_object.assign": Array [
              Object {
                "_state": "block.properties.obj",
              },
              Object {
                "field": Object {
                  "_yaml.parse": Object {
                    "_if_none": Array [
                      Object {
                        "_state": "block.properties.obj.field",
                      },
                      "",
                    ],
                  },
                },
              },
            ],
          },
        },
      ],
    }
  `);
});

test('yaml schemaNested defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaNested)).toMatchInlineSnapshot(`Object {}`);
  const schemaDV = {
    schema: {
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
                  displayType: 'yaml',
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
