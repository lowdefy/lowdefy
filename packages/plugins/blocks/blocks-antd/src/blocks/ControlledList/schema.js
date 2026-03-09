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

const schema = {
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'Controlled list title.',
      },
      addToFront: {
        type: 'boolean',
        default: false,
        description: 'When true, add new items to the front of the list.',
      },
      hideAddButton: {
        type: 'boolean',
        default: false,
        description: 'When true, hide the add new item button.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'When true, hide the add new item button.',
      },
      addItemButton: {
        type: 'object',
        description: 'Custom add item button properties.',
        docs: {
          displayType: 'button',
        },
      },
      removeItemIcon: {
        type: ['string', 'object'],
        description: 'Custom remove item icon properties.',
        docs: {
          displayType: 'icon',
        },
      },
      noDataTitle: {
        type: 'string',
        description: 'Title to show when list is empty.',
      },
      minItems: {
        type: 'number',
        default: 0,
        description: 'Minimum number of items in the controlled list.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
  cssKeys: ['element', 'header', 'footer', 'item'],
};

export default schema;
