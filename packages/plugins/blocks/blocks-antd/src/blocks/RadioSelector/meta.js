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

import LabelMeta from '../Label/meta.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons],
  valueType: 'any',
  cssKeys: {
    element: 'The RadioSelector element.',
    label: 'The RadioSelector label.',
    extra: 'The RadioSelector extra content.',
    feedback: 'The RadioSelector validation feedback.',
  },
  events: {
    onChange: 'Trigger action when selection is changed.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      align: {
        type: 'string',
        enum: ['start', 'end', 'center', 'baseline'],
        default: 'start',
        description: 'Align options.',
      },
      color: {
        type: 'string',
        description: 'Selected radio color.',
        docs: {
          displayType: 'color',
        },
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      direction: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
        description: 'List options horizontally or vertical.',
      },
      wrap: {
        type: 'boolean',
        default: true,
        description: "Specifies wrapping of options. Applies when 'direction' is 'horizontal'.",
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
                  description: 'Value selected.',
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
            description: 'Size of the radio button circle.',
          },
          dotSize: {
            type: 'number',
            default: 6,
            description: 'Size of the inner dot indicator.',
          },
          dotColorDisabled: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.25)',
            description: 'Dot color when the radio is disabled.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color for the selected radio button.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the radio button circle.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the radio button circle.',
          },
          wrapperMarginInlineEnd: {
            type: 'number',
            default: 8,
            description: 'Right margin of the radio wrapper.',
          },
          radioColor: {
            type: 'string',
            default: '#fff',
            description: 'Color of the radio indicator dot when selected.',
          },
          radioBgColor: {
            type: 'string',
            description: 'Background color of the radio circle when selected.',
          },
          buttonBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color for button-style radio.',
          },
          buttonCheckedBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color for checked button-style radio.',
          },
          buttonColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Text color for button-style radio.',
          },
          buttonPaddingInline: {
            type: 'number',
            default: 15,
            description: 'Horizontal padding for button-style radio.',
          },
          buttonCheckedBgDisabled: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.15)',
            description: 'Background color for disabled checked button-style radio.',
          },
          buttonCheckedColorDisabled: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.25)',
            description: 'Text color for disabled checked button-style radio.',
          },
          buttonSolidCheckedColor: {
            type: 'string',
            default: '#fff',
            description: 'Text color for solid button-style radio when checked.',
          },
          buttonSolidCheckedBg: {
            type: 'string',
            description: 'Background color for solid button-style radio when checked.',
          },
          buttonSolidCheckedHoverBg: {
            type: 'string',
            description: 'Hover background for solid button-style radio when checked.',
          },
          buttonSolidCheckedActiveBg: {
            type: 'string',
            description: 'Active background for solid button-style radio when checked.',
          },
        },
      },
    },
  },
};
