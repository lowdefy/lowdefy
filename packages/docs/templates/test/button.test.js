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
            displayType: 'button',
          },
        },
      },
    },
  },
};

test('button propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    Array [
      Object {
        "blocks": Array [
          Object {
            "id": "block.properties.field.icon",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "allowClear": true,
              "label": Object {
                "align": "right",
                "extra": "Name of an Ant Design Icon or properties of an Icon block to use icon in button.",
                "span": 8,
              },
              "options": Object {
                "_global": "all_icons",
              },
              "showSearch": true,
              "size": "small",
              "title": "icon",
            },
            "type": "Selector",
          },
          Object {
            "id": "block.properties.field.title",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
                "align": "right",
                "extra": "Title text on the button.",
                "span": 8,
              },
              "size": "small",
              "title": "title",
            },
            "type": "TextInput",
          },
          Object {
            "id": "block.properties.field.type",
            "layout": Object {
              "_global": "settings_input_layout",
            },
            "properties": Object {
              "label": Object {
                "align": "right",
                "extra": "The button type.",
                "span": 8,
              },
              "options": Array [
                "primary",
                "default",
                "dashed",
                "danger",
                "link",
                "text",
              ],
              "size": "small",
              "title": "type",
            },
            "type": "ButtonSelector",
          },
        ],
        "id": "block.properties.field_button_card",
        "layout": Object {
          "contentGutter": 0,
        },
        "properties": Object {
          "inner": true,
          "size": "small",
          "title": "button:",
        },
        "type": "Card",
      },
    ]
  `);
});

test('button propertiesGetterTransformer', () => {
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

test('button defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`Object {}`);
  const schemaDV = {
    schema: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          field: {
            type: 'object',
            description: 'description',
            docs: {
              displayType: 'button',
            },
            default: {
              icon: 'UploadOutlined',
              title: 'Upload',
              type: 'default',
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    Object {
      "field": Object {
        "icon": "UploadOutlined",
        "title": "Upload",
        "type": "default",
      },
    }
  `);
});
