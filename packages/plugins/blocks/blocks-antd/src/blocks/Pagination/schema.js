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
      total: {
        type: 'integer',
        default: 100,
        description: 'Total number of items to be displayed in pagination.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default'],
        default: 'default',
        description: 'Pagination element size.',
      },
      simple: {
        type: 'boolean',
        default: false,
        description: 'Use simplified pagination display.',
      },
      showTotal: {
        type: ['boolean', 'string', 'object'],
        default: false,
        description:
          'Show pagination total number and range if boolean, or define a custom string or function to display.',
        docs: {
          displayType: 'string',
        },
      },
      showSizeChanger: {
        type: 'boolean',
        default: false,
        description: 'Determine whether to show page size select, it will be true when total > 50.',
      },
      showQuickJumper: {
        type: 'boolean',
        default: false,
        description: 'Determine whether you can jump to pages directly.',
      },
      pageSizeOptions: {
        type: 'array',
        default: [10, 20, 30, 40],
        description: 'Specify the page size changer options.',
        items: {
          type: 'number',
        },
      },
      hideOnSinglePage: {
        type: 'boolean',
        default: false,
        description: 'Hide pager on short list of a single page.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable pager.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/pagination#design-token',
        },
        properties: {
          itemBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color for pagination items.',
          },
          itemSize: {
            type: 'number',
            default: 32,
            description: 'Size of pagination items.',
          },
          itemSizeSM: {
            type: 'number',
            default: 24,
            description: 'Size of pagination items in small mode.',
          },
          itemActiveBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color for the active pagination item.',
          },
          itemActiveColor: {
            type: 'string',
            description: 'Text color for the active pagination item.',
          },
          itemActiveColorDisabled: {
            type: 'string',
            default: 'rgba(0,0,0,0.25)',
            description: 'Text color for the active item when disabled.',
          },
          itemActiveBgDisabled: {
            type: 'string',
            default: 'rgba(0,0,0,0.15)',
            description: 'Background color for the active item when disabled.',
          },
          itemLinkBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color for prev/next link items.',
          },
          itemInputBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color for the quick jumper input.',
          },
          miniOptionsSizeChangerTop: {
            type: 'number',
            default: 0,
            description: 'Top offset for the size changer in mini/small mode.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color for active and hover states.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Primary color on hover.',
          },
          colorText: {
            type: 'string',
            description: 'Default text color for pagination items.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color for pagination items.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius for pagination items.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size for pagination items.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Control height, affects item size.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding for pagination items.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for small pagination items.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for large pagination items.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for pagination items.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for small pagination items.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for large pagination items.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onSizeChange: {
        type: 'array',
        description: 'Triggered when page size is changed.',
      },
      onChange: {
        type: 'array',
        description: 'Triggered when current page is changed.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
