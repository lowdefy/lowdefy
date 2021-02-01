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
            displayType: 'style',
          },
        },
      },
    },
  },
};

test('style propertiesFormTransformer', () => {
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

test('style propertiesGetterTransformer', () => {
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

test('style defaultValueTransformer', () => {
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
              displayType: 'style',
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
