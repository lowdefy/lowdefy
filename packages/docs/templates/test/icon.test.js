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
          type: ['string', 'object'],
          description: 'description',
          docs: {
            displayType: 'icon',
          },
        },
      },
    },
  },
};

test('icon propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    Array [
      Object {
        "id": "block.properties.field",
        "layout": Object {
          "_global": "settings_input_layout",
        },
        "properties": Object {
          "allowClear": true,
          "label": Object {
            "align": "right",
            "extra": "description",
            "span": 8,
          },
          "options": Object {
            "_global": "all_icons",
          },
          "showSearch": true,
          "size": "small",
          "title": "field",
        },
        "required": false,
        "type": "Selector",
      },
    ]
  `);
});

test('icon propertiesGetterTransformer', () => {
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

test('icon defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`Object {}`);
  const schemaDV = {
    schema: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          field: {
            type: ['string', 'object'],
            default: 'value',
            description: 'description',
            docs: {
              displayType: 'icon',
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
