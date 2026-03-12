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
      bordered: {
        type: 'boolean',
        default: false,
        description: 'Render items in a table.',
      },
      colon: {
        type: 'boolean',
        default: true,
        description: 'Include a colon in item labels.',
      },
      column: {
        default: 3,
        oneOf: [
          {
            type: 'number',
            description: 'The number of description items in a row.',
          },
          {
            type: 'object',
            properties: {
              xs: {
                type: 'integer',
                description: "The number of description items in a row for 'xs' media size.",
              },
              sm: {
                type: 'integer',
                description: "The number of description items in a row for 'sm' media size.",
              },
              md: {
                type: 'integer',
                description: "The number of description items in a row for 'md' media size.",
              },
              lg: {
                type: 'integer',
                description: "The number of description items in a row for 'lg' media size.",
              },
              xl: {
                type: 'integer',
                description: "The number of description items in a row for 'xl' media size.",
              },
            },
          },
        ],
      },
      itemOptions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key'],
          properties: {
            key: {
              type: 'string',
              description: 'Item key to which these settings should apply.',
            },
            span: {
              type: ['number', 'object'],
              description:
                'Item span for this key. Can also be a function that receives item and index.',
              docs: {
                displayType: 'number',
              },
            },
            style: {
              type: 'object',
              description:
                'Item css style for this key. Can also be a function that receives item and index.',
              docs: {
                displayType: 'yaml',
              },
            },
            transformLabel: {
              type: 'object',
              description:
                'Function to transform item key or label. Function receives arguments label, item and index.',
              docs: {
                displayType: 'yaml',
              },
            },
            transformValue: {
              type: 'object',
              description:
                'Function to transform item value. Function receives arguments value, item and index.',
              docs: {
                displayType: 'yaml',
              },
            },
          },
        },
      },
      items: {
        oneOf: [
          {
            type: 'array',
            description: 'List of items to display',
            items: {
              type: 'object',
              required: ['label'],
              properties: {
                contentStyle: {
                  type: 'object',
                  description: 'Customize content style.',
                  docs: {
                    displayType: 'yaml',
                  },
                },
                labelStyle: {
                  type: 'object',
                  description: 'Customize label style.',
                  docs: {
                    displayType: 'yaml',
                  },
                },
                label: {
                  type: 'string',
                  description: 'Item label - supports html.',
                },
                value: {
                  oneOf: [
                    {
                      type: 'string',
                      description: 'Value of item - supports html.',
                    },
                    {
                      type: 'number',
                      description: 'Value of item - supports html.',
                    },
                  ],
                },
                span: {
                  type: 'integer',
                  description: 'Number of columns for this item to span.',
                },
                style: {
                  type: 'object',
                  description: 'Css style object to applied to item.',
                  docs: {
                    displayType: 'yaml',
                  },
                },
              },
            },
          },
          {
            type: 'object',
            description: 'Object of key value pairs to display',
            docs: {
              displayType: 'yaml',
            },
          },
        ],
      },
      layout: {
        type: 'string',
        description: 'Put values next to or below their labels.',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
      },
      size: {
        type: 'string',
        description: 'Size of the block.',
        enum: ['default', 'small'],
        default: 'default',
      },
      title: {
        type: 'string',
        description: 'The title of the description block, placed at the top - supports html.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/descriptions#design-token',
        },
        properties: {
          labelBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.02)',
            description: 'Background color for labels in bordered mode.',
          },
          labelColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.45)',
            description: 'Text color for labels.',
          },
          titleColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Color for the component title.',
          },
          titleMarginBottom: {
            type: 'number',
            default: 20,
            description: 'Bottom margin spacing for the title.',
          },
          itemPaddingBottom: {
            type: 'number',
            default: 16,
            description: 'Bottom padding for description items.',
          },
          itemPaddingEnd: {
            type: 'number',
            default: 16,
            description: 'End (right in LTR) padding for description items.',
          },
          colonMarginRight: {
            type: 'number',
            default: 8,
            description: 'Right margin for colons after labels.',
          },
          colonMarginLeft: {
            type: 'number',
            default: 2,
            description: 'Left margin for colons after labels.',
          },
          contentColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Text color for content values.',
          },
          extraColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Color for extra content in the header.',
          },
        },
      },
    },
  },
  cssKeys: ['element', 'content', 'label'],
};

export default schema;
