import propertiesFormTransformer from '../blocks/propertiesFormTransformer';
import propertiesGetterTransformer from '../blocks/propertiesGetterTransformer';
import defaultValueTransformer from '../blocks/defaultValueTransformer';

const schema = {
  schema: {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        bool: {
          type: 'boolean',
          description: 'description.',
        },
      },
    },
  },
};

test('boolean propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    Array [
      Object {
        "id": "block.properties.bool",
        "layout": Object {
          "_global": "settings_input_layout",
        },
        "properties": Object {
          "label": Object {
            "align": "right",
            "extra": "description.",
            "span": 8,
          },
          "size": "small",
          "title": "bool",
        },
        "required": false,
        "type": "Switch",
      },
    ]
  `);
});

test('boolean propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": Object {
            "default": Object {},
            "key": "block.properties",
          },
        },
      ],
    }
  `);
});

test('boolean defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "bool": false,
    }
  `);
  const schemaDV = {
    schema: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          bool: {
            type: 'boolean',
            default: true,
            description: 'description.',
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    Object {
      "bool": true,
    }
  `);
});
