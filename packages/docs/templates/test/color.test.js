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
          type: 'string',
          description: 'description',
          docs: {
            displayType: 'color',
          },
        },
      },
    },
  },
};

test('color propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    Array [
      Object {
        "id": "block.properties.field",
        "layout": Object {
          "_global": "settings_input_layout",
        },
        "properties": Object {
          "circleSize": 14,
          "circleSpacing": 8,
          "colors": Array [
            "#f5222d",
            "#fa541c",
            "#fa8c16",
            "#faad14",
            "#fadb14",
            "#a0d911",
            "#52c41a",
            "#13c2c2",
            "#1890ff",
            "#2f54eb",
            "#722ed1",
            "#eb2f96",
            "#595959",
            "#bfbfbf",
            "#d9d9d9",
          ],
          "label": Object {
            "align": "right",
            "extra": "description",
            "span": 8,
          },
          "showValue": true,
          "size": "small",
          "title": "field",
        },
        "required": false,
        "type": "CircleColorSelector",
      },
    ]
  `);
});

test('color propertiesGetterTransformer', () => {
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

test('color defaultValueTransformer', () => {
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
            type: 'string',
            default: 'value',
            description: 'description',
            docs: {
              displayType: 'color',
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
