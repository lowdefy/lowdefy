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

export default {
  category: 'list',
  icons: ['AiOutlinePlus', 'AiOutlineMinusCircle'],
  valueType: 'array',
  cssKeys: {
    element: 'The ControlledList element.',
    header: 'The ControlledList header.',
    footer: 'The ControlledList footer.',
    item: 'The ControlledList item.',
    removeIcon: 'The remove item icon in the ControlledList.',
  },
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
        description: 'Size of the list.',
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
      hideRemoveButton: {
        type: 'boolean',
        default: false,
        description: 'When true, hide the remove item button on each list item.',
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
          link: 'https://ant.design/components/list#design-token',
        },
        properties: {
          titleMarginBottom: {
            type: 'number',
            default: 12,
            description: 'Margin bottom of list item title.',
          },
          contentWidth: {
            type: 'number',
            default: 220,
            description: 'Width of the content area.',
          },
          itemPadding: {
            type: 'string',
            default: '12px 0',
            description: 'Padding of list items.',
          },
          itemPaddingLG: {
            type: 'string',
            default: '16px 24px',
            description: 'Padding of list items (large size).',
          },
          itemPaddingSM: {
            type: 'string',
            default: '8px 16px',
            description: 'Padding of list items (small size).',
          },
          headerBg: {
            type: 'string',
            default: 'transparent',
            description: 'Background color of the list header.',
          },
          footerBg: {
            type: 'string',
            default: 'transparent',
            description: 'Background color of the list footer.',
          },
          emptyTextPadding: {
            type: 'number',
            default: 32,
            description: 'Padding for the empty text area.',
          },
          metaMarginBottom: {
            type: 'number',
            default: 16,
            description: 'Margin bottom of list item meta.',
          },
          avatarMarginRight: {
            type: 'number',
            default: 16,
            description: 'Margin right of the avatar in list items.',
          },
          descriptionFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the description text.',
          },
        },
      },
    },
  },
};
