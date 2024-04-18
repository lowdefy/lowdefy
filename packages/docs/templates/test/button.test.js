/*
  Copyright 2020-2024 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import propertiesFormTransformer from '../blocks/propertiesFormTransformer.js';
import propertiesGetterTransformer from '../blocks/propertiesGetterTransformer.js';
import defaultValueTransformer from '../blocks/defaultValueTransformer.js';

const schema = {
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
                "extra": "Name of an React-Icon (See <a href=\\"https://react-icons.github.io/react-icons/\\">all icons</a>) or properties of an Icon block to use icon in button.",
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
          "title": "block.properties.field:",
        },
        "type": "Card",
      },
    ]
  `);
});

test('button propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schema, { block_type: 'Block' })).toMatchInlineSnapshot(`
    Object {
      "_object.assign": Array [
        Object {
          "_state": Object {
            "contextId": "Block:Block:{}",
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
            icon: 'AiOutlineUpload',
            title: 'Upload',
            type: 'default',
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    Object {
      "field": Object {
        "icon": "AiOutlineUpload",
        "title": "Upload",
        "type": "default",
      },
    }
  `);
});
