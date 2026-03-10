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
      block: {
        type: 'boolean',
        default: false,
        description: "Option to fit width to its parent's width.",
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
              'Options can either be an array of primitive values, or an array of label, value pairs - supports html.',
            items: {
              type: 'string',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, or an array of label, value pairs.',
            items: {
              type: 'number',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, or an array of label, value pairs.',
            items: {
              type: 'boolean',
            },
          },
          {
            type: 'array',
            description:
              'Options can either be an array of primitive values, or an array of label, value pairs.',
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
                icon: {
                  type: 'string',
                  description:
                    'Name of a React-Icon (See <a href="https://react-icons.github.io/react-icons/">all icons</a>) to display in the segment option.',
                  docs: {
                    displayType: 'icon',
                  },
                },
              },
            },
          },
        ],
      },
      shape: {
        type: 'string',
        enum: ['default', 'round'],
        default: 'default',
        description: 'Shape of the segmented control.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
      },
      vertical: {
        type: 'boolean',
        default: false,
        description: 'Display the segmented control vertically.',
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
