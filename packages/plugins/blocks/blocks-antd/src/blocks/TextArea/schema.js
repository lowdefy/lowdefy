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
      allowClear: {
        type: 'boolean',
        default: false,
        description: 'Allow the user to clear their input.',
      },
      autoFocus: {
        type: 'boolean',
        default: false,
        description: 'Autofocus to the block on page load.',
      },
      autoSize: {
        oneOf: [
          {
            type: 'boolean',
            default: false,
            description: 'Automatically extend the block number of rows.',
          },
          {
            type: 'object',
            description:
              'Automatically extend the block number of rows, with a set minimum and maximum row amount.',
            properties: {
              minRows: {
                type: 'integer',
                description: 'Minimum number of rows the block can be.',
              },
              maxRows: {
                type: 'integer',
                description: 'Maximum number of rows the block can be.',
              },
            },
          },
        ],
        description:
          'autoSize can either be a boolean value, or an object with minimum and maximum rows.  Defining autoSize disables any prefix or suffix defined.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Whether or not the textarea has a border style.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      label: {
        type: 'object',
        description: 'Label properties.',
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
          extra: {
            type: 'string',
            description: 'Extra text to display beneath the content - supports html.',
          },
          title: {
            type: 'string',
            description: 'Label title - supports html.',
          },
          span: {
            type: 'number',
            description: 'Label inline span.',
          },
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Hide input label.',
          },
          hasFeedback: {
            type: 'boolean',
            default: true,
            description:
              'Display feedback extra from validation, this does not disable validation.',
          },
          inline: {
            type: 'boolean',
            default: false,
            description: 'Render input and label inline.',
          },
        },
      },
      maxLength: {
        type: 'integer',
        description: 'The max number of input characters.',
      },
      placeholder: {
        type: 'string',
        description: 'Placeholder text inside the block before user types input.',
      },
      rows: {
        type: 'integer',
        minimum: 1,
        description:
          'Number of rows in the block, should be greater or equal to 1. Defining rows disables any prefix.',
      },
      size: {
        type: 'string',
        enum: ['small', 'middle', 'large'],
        default: 'middle',
        description: 'Size of the block.',
      },
      showCount: {
        type: ['boolean', 'object'],
        default: false,
        description: 'Show input character count.',
        docs: {
          displayType: 'boolean',
        },
      },
      title: {
        type: 'string',
        description:
          'Title to describe the input component, if no title is specified the block id is displayed - supports html.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/input#design-token',
        },
        properties: {
          activeBorderColor: {
            type: 'string',
            description: 'Border color when the input is active/focused.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color when the input is hovered.',
          },
          activeShadow: {
            type: 'string',
            description: 'Box shadow when the input is active/focused.',
          },
          errorActiveShadow: {
            type: 'string',
            description: 'Box shadow when the input is active in error status.',
          },
          warningActiveShadow: {
            type: 'string',
            description: 'Box shadow when the input is active in warning status.',
          },
          addonBg: {
            type: 'string',
            description: 'Background color of addon elements.',
          },
          hoverBg: {
            type: 'string',
            description: 'Background color on hover.',
          },
          activeBg: {
            type: 'string',
            description: 'Background color when active/focused.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding for the input.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for the small input.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for the large input.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for the input.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for the small input.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for the large input.',
          },
          inputFontSize: {
            type: 'number',
            default: 14,
            description: 'Font size for the input.',
          },
          inputFontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for the small input.',
          },
          inputFontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for the large input.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the input.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for the large input.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for the small input.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color override, affects focus border color.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Primary hover color, affects hover border color.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the input container.',
          },
          colorText: {
            type: 'string',
            description: 'Text color of the input.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the input.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Color of the placeholder text.',
          },
          colorTextDisabled: {
            type: 'string',
            description: 'Text color when the input is disabled.',
          },
          colorBgContainerDisabled: {
            type: 'string',
            description: 'Background color when the input is disabled.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Base font size.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for the large variant.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onBlur: {
        type: 'array',
        description: 'Trigger action event occurs when text input loses focus.',
      },
      onChange: {
        type: 'array',
        description: 'Trigger action when text input is changed.',
      },
      onFocus: {
        type: 'array',
        description: 'Trigger action when text input gets focus.',
      },
      onPressEnter: {
        type: 'array',
        description: 'Trigger action when enter is pressed while text input is focused.',
      },
    },
  },
  cssKeys: ['element', 'label', 'extra', 'feedback'],
};

export default schema;
