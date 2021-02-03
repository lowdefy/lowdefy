import propertiesFormTransformer from '../blocks/propertiesFormTransformer';
import propertiesGetterTransformer from '../blocks/propertiesGetterTransformer';
import defaultValueTransformer from '../blocks/defaultValueTransformer';

const schema = {
  schema: {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        num: {
          type: 'integer',
          description: 'description.',
        },
      },
    },
  },
};

test('integer propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    Array [
      Object {
        "id": "block.properties.num",
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
          "step": 1,
          "title": "num",
        },
        "required": false,
        "type": "NumberInput",
      },
    ]
  `);
});

test('integer propertiesGetterTransformer', () => {
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

test('integer defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    Object {
      "num": null,
    }
  `);
  const schemaDV = {
    schema: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          num: {
            type: 'integer',
            default: 1,
            description: 'description.',
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    Object {
      "num": 1,
    }
  `);
});
