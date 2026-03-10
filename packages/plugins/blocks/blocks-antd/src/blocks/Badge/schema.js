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
      color: {
        type: 'string',
        description: 'Customize Badge dot color.',
        docs: {
          displayType: 'color',
        },
      },
      count: {
        type: ['number', 'string'],
        description: 'Text to show in badge.',
        docs: {
          displayType: 'string',
        },
      },
      dot: {
        type: 'boolean',
        default: false,
        description: 'Whether to display a red dot instead of count.',
      },
      size: {
        type: 'string',
        default: 'default',
        enum: ['default', 'small'],
        description: 'Sets the size of badge if count is set.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use an icon in badge.",
        docs: {
          displayType: 'icon',
        },
      },
      offset: {
        type: 'array',
        items: {
          type: 'number',
        },
        description: 'Set offset of the badge dot, array of numbers for x and y offset ([x,y]).',
      },
      overflowCount: {
        type: 'number',
        default: 99,
        description: 'Max count to show',
      },
      showZero: {
        type: 'boolean',
        default: false,
        description: 'Whether to show badge when count is zero.',
      },
      status: {
        type: 'string',
        enum: ['success', 'processing', 'default', 'error', 'warning'],
        default: null,
        description: 'Set Badge as a status dot.',
      },
      text: {
        type: 'string',
        description: 'If status is set, text sets the display text of the status dot.',
      },
      title: {
        type: 'string',
        description: 'Text to show when hovering over the badge.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/badge#design-token',
        },
        properties: {
          indicatorHeight: {
            type: 'number',
            default: 20,
            description: 'Height of the badge indicator.',
          },
          indicatorHeightSM: {
            type: 'number',
            default: 14,
            description: 'Height of the badge indicator in small size.',
          },
          dotSize: {
            type: 'number',
            default: 6,
            description: 'Size of the dot badge.',
          },
          textFontSize: {
            type: 'number',
            default: 12,
            description: 'Font size for badge count text.',
          },
          textFontSizeSM: {
            type: 'number',
            default: 12,
            description: 'Font size for badge count text in small size.',
          },
          textFontWeight: {
            type: 'string',
            default: 'normal',
            description: 'Font weight for badge count text.',
          },
          textLineHeight: {
            type: 'number',
            description: 'Line height for badge count text.',
          },
          statusSize: {
            type: 'number',
            default: 6,
            description: 'Size of the status dot.',
          },
          indicatorZIndex: {
            type: ['number', 'string'],
            default: 'auto',
            description: 'Z-index of the badge indicator.',
          },
          colorBorderBg: {
            type: 'string',
            description:
              'Background color of the badge border (gap between badge and wrapped element).',
          },
          colorError: {
            type: 'string',
            description: 'Color of the badge indicator (default red).',
          },
          colorErrorHover: {
            type: 'string',
            description: 'Hover color of the badge indicator.',
          },
        },
      },
    },
  },
  cssKeys: ['element', 'indicator'],
};

export default schema;
