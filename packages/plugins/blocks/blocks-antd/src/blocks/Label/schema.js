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
      align: {
        type: 'string',
        enum: ['left', 'right'],
        default: 'left',
        description: 'Align label left or right when inline.',
      },
      colon: {
        type: 'boolean',
        default: true,
        description: 'Append label with colon.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable to not render a label title.',
      },
      extra: {
        type: 'string',
        description: 'Extra text to display beneath the content - supports html.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
      },
      title: {
        type: 'string',
        description: 'Label title - supports html.',
      },
      span: {
        type: 'number',
        description: 'Label inline span.',
      },
      inline: {
        type: 'boolean',
        default: false,
        description: 'Render input and label inline.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/form#design-token',
        },
        properties: {
          labelFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the label text.',
          },
          labelColor: {
            type: 'string',
            default: 'rgba(0,0,0,0.88)',
            description: 'Text color of the label.',
          },
          labelRequiredMarkColor: {
            type: 'string',
            default: '#ff4d4f',
            description: 'Color of the required asterisk mark.',
          },
          labelColonMarginInlineStart: {
            type: 'number',
            default: 2,
            description: 'Inline start margin of the colon after the label.',
          },
          labelColonMarginInlineEnd: {
            type: 'number',
            default: 8,
            description: 'Inline end margin of the colon after the label.',
          },
          colorError: {
            type: 'string',
            default: '#ff4d4f',
            description: 'Color used for error validation feedback.',
          },
          colorWarning: {
            type: 'string',
            default: '#faad14',
            description: 'Color used for warning validation feedback.',
          },
          colorSuccess: {
            type: 'string',
            default: '#52c41a',
            description: 'Color used for success validation feedback.',
          },
          colorText: {
            type: 'string',
            description: 'Text color for the extra and feedback text.',
          },
          colorTextDescription: {
            type: 'string',
            description: 'Color for the extra description text.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Base font size.',
          },
        },
      },
    },
  },
  cssKeys: ['element', 'label', 'extra', 'feedback'],
};

export default schema;
