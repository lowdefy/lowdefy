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
      buttonStyle: {
        type: 'string',
        enum: ['solid', 'outline'],
        default: 'solid',
        description: 'Style of the selected option button.',
      },
      color: {
        type: 'string',
        description: 'Selected button color.',
        docs: {
          displayType: 'color',
        },
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      options: {
        default: [],
        oneOf: [
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, on an array of label, value pairs - supports html.',
            items: {
              type: 'string',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, on an array of label, value pairs.',
            items: {
              type: 'number',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, on an array of label, value pairs.',
            items: {
              type: 'boolean',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, on an array of label, value pairs.',
            items: {
              type: 'object',
              required: ['value'],
              properties: {
                label: {
                  type: 'string',
                  description: 'Value label shown to user - supports html.',
                },
                value: {
                  description: 'Value selected. Can be of any type.',
                  oneOf: [
                    {
                      type: 'string',
                    },
                    {
                      type: 'number',
                    },
                    {
                      type: 'boolean',
                    },
                    {
                      type: 'object',
                    },
                    {
                      type: 'array',
                    },
                  ],
                  docs: {
                    displayType: 'yaml',
                  },
                },
                disabled: {
                  type: 'boolean',
                  default: false,
                  description: 'Disable the option if true.',
                },
                style: {
                  type: 'object',
                  description: 'Css style to applied to option.',
                  docs: {
                    displayType: 'yaml',
                  },
                },
              },
            },
          },
        ],
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
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
          link: 'https://ant.design/components/radio#design-token',
        },
        properties: {
          radioSize: {
            type: 'number',
            default: 16,
            description: 'Size of the radio dot element.',
          },
          dotSize: {
            type: 'number',
            default: 8,
            description: 'Size of the inner dot when checked.',
          },
          dotColorDisabled: {
            type: 'string',
            description: 'Color of the inner dot when disabled.',
          },
          buttonSolidCheckedColor: {
            type: 'string',
            description: 'Text color of checked button in solid style.',
          },
          buttonSolidCheckedBg: {
            type: 'string',
            description: 'Background color of checked button in solid style.',
          },
          buttonSolidCheckedHoverBg: {
            type: 'string',
            description: 'Background color of checked button on hover in solid style.',
          },
          buttonSolidCheckedActiveBg: {
            type: 'string',
            description: 'Background color of checked button on active in solid style.',
          },
          buttonBg: {
            type: 'string',
            description: 'Background color of unchecked radio buttons.',
          },
          buttonCheckedBg: {
            type: 'string',
            description: 'Background color of checked button in outline style.',
          },
          buttonColor: {
            type: 'string',
            description: 'Text color of radio buttons.',
          },
          buttonCheckedBgDisabled: {
            type: 'string',
            description: 'Background color of checked button when disabled.',
          },
          buttonCheckedColorDisabled: {
            type: 'string',
            description: 'Text color of checked button when disabled.',
          },
          buttonPaddingInline: {
            type: 'number',
            default: 15,
            description: 'Horizontal padding inside radio buttons.',
          },
          wrapperMarginInlineEnd: {
            type: 'number',
            default: 8,
            description: 'Margin at the inline end of each radio wrapper.',
          },
          radioColor: {
            type: 'string',
            description: 'Color of the radio dot when checked.',
          },
          radioBgColor: {
            type: 'string',
            description: 'Background color of the radio circle when checked.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius for default-sized radio buttons.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large radio buttons.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for small radio buttons.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of default-sized radio buttons.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height of large radio buttons.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height of small radio buttons.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size for default-sized radio buttons.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for large radio buttons.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width of radio buttons.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color used for checked state border and text.',
          },
          colorPrimaryHover: {
            type: 'string',
            description: 'Primary hover color for checked radio buttons.',
          },
          colorPrimaryActive: {
            type: 'string',
            description: 'Primary active color for checked radio buttons.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color for the radio button container.',
          },
          colorText: {
            type: 'string',
            description: 'Default text color for radio buttons.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color for radio buttons.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onChange: {
        type: 'array',
        description: 'Trigger actions when selection is changed.',
      },
    },
  },
  cssKeys: ['element', 'label', 'extra', 'feedback'],
};

export default schema;
