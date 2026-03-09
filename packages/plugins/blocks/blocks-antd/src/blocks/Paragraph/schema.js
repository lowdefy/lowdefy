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
      code: {
        type: 'boolean',
        default: false,
        description: 'Apply code style.',
      },
      content: {
        type: 'string',
        description: 'Paragraph text content - supports html.',
        docs: {
          displayType: 'text-area',
        },
      },
      copyable: {
        description: 'Provide copy text button.',
        default: false,
        oneOf: [
          {
            type: 'boolean',
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              text: {
                type: 'string',
                description: 'Paragraph text to copy when clicked.',
              },
              icon: {
                type: ['string', 'object', 'array'],
                description:
                  'Copy icon, can be an array or two icons for before and after clicked.',
                docs: {
                  displayType: 'icon',
                },
              },
              tooltips: {
                type: ['string', 'array'],
                description:
                  'Tooltip text, can be an array or two strings for before and after clicked.',
                docs: {
                  displayType: 'string',
                },
              },
            },
          },
        ],
      },
      delete: {
        type: 'boolean',
        default: false,
        description: 'Apply deleted (strikethrough) style.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Apply disabled style.',
      },
      ellipsis: {
        default: false,
        oneOf: [
          {
            type: 'boolean',
            description: 'Display ellipsis when text overflows a single line.',
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              rows: {
                type: 'number',
                description: 'Max rows of content.',
              },
              expandable: {
                type: 'boolean',
                description: 'Expand hidden content when clicked.',
              },
              suffix: {
                type: 'string',
                description: 'Suffix of ellipses content.',
              },
            },
          },
        ],
      },
      italic: {
        type: 'boolean',
        default: false,
        description: 'Apply italic style.',
      },
      mark: {
        type: 'boolean',
        default: false,
        description: 'Apply marked (highlighted) style.',
      },
      strong: {
        type: 'boolean',
        default: false,
        description: 'Apply strong (bold) style.',
      },
      type: {
        type: 'string',
        default: 'default',
        enum: ['success', 'default', 'secondary', 'warning', 'danger'],
        description: "Additional types. Don't specify for default.",
      },
      underline: {
        type: 'boolean',
        default: false,
        description: 'Apply underline style.',
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
      onExpand: {
        type: 'array',
        description: 'Trigger action when ellipse expand is clicked.',
      },
      onCopy: {
        type: 'array',
        description: 'Trigger action when copy text is clicked.',
      },
      onTextSelection: {
        type: 'array',
        description:
          'Trigger action when text is selected and pass selected text to the event object.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
