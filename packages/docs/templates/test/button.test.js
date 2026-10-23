/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { expect, test } from 'vitest';

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
    [
      {
        "blocks": [
          {
            "id": "block.properties.field.icon",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "allowClear": true,
              "label": {
                "align": "right",
                "extra": "Icon name, such as the semantic name <code>edit</code> or the <a href="https://lucide.dev/icons">Lucide</a> name <code>Pencil</code>, or properties of an Icon block to use as the button icon.",
                "span": 8,
              },
              "options": {
                "_global": "all_icons",
              },
              "showSearch": true,
              "size": "small",
              "title": "icon",
            },
            "type": "Selector",
          },
          {
            "id": "block.properties.field.title",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "label": {
                "align": "right",
                "extra": "Title text on the button.",
                "span": 8,
              },
              "size": "small",
              "title": "title",
            },
            "type": "TextInput",
          },
          {
            "id": "block.properties.field.type",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "label": {
                "align": "right",
                "extra": "The button type.",
                "span": 8,
              },
              "options": [
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
        "layout": {
          "gap": 0,
        },
        "properties": {
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
    {
      "_object.assign": [
        {
          "_state": {
            "contextId": "Block:Block:{}",
            "default": {},
            "key": "block.properties",
          },
        },
      ],
    }
  `);
});

test('button defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`{}`);
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
            icon: 'upload',
            title: 'Upload',
            type: 'default',
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "field": {
        "icon": "upload",
        "title": "Upload",
        "type": "default",
      },
    }
  `);
});
