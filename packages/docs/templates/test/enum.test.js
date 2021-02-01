import propertiesFormTransformer from '../blocks/propertiesFormTransformer';
import propertiesGetterTransformer from '../blocks/propertiesGetterTransformer';
import defaultValueTransformer from '../blocks/defaultValueTransformer';

const schema = {
  schema: {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        enum: {
          type: 'string',
          enum: ['a', 'b', 'c'],
          description: 'description.',
        },
      },
    },
  },
};

test('enum propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    Array [
      Object {
        "id": "block.properties.enum",
        "layout": Object {
          "_global": "settings_input_layout",
        },
        "properties": Object {
          "label": Object {
            "align": "right",
            "extra": "description.",
            "span": 8,
          },
          "options": Array [
            "a",
            "b",
            "c",
          ],
          "size": "small",
          "title": "enum",
        },
        "required": false,
        "type": "ButtonSelector",
      },
    ]
  `);
});

test('enum propertiesGetterTransformer', () => {
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

test('enum defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "enum": null,
    }
  `);
  const schemaDV = {
    schema: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          enum: {
            type: 'string',
            enum: ['a', 'b', 'c'],
            default: 'a',
            description: 'description.',
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    Object {
      "enum": "a",
    }
  `);
});
