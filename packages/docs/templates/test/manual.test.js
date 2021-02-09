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
  expect(propertiesGetterTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": Object {
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
  expect(propertiesGetterTransformer(schemaNested)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": Object {
            "default": Object {},
            "key": "block.properties",
          },
        },
        Object {
          "obj": Object {
            "_object.assign": Array [
              Object {
                "_state": Object {
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
