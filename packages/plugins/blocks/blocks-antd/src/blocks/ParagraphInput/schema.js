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
      copyable: {
        default: false,
        oneOf: [
          {
            type: 'boolean',
            description: 'Provide copy text button.',
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
      editable: {
        default: true,
        oneOf: [
          {
            type: 'boolean',
            description:
              'Allow paragraph editing when true, editable settings can be provided with editable object.',
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              icon: {
                type: ['string', 'object'],
                description: 'Edit icon.',
                docs: {
                  displayType: 'icon',
                },
              },
              tooltip: {
                type: 'string',
                description: 'Edit tooltip text.',
              },
              editing: {
                type: 'boolean',
                description: 'Control editing state.',
              },
              maxLength: {
                type: 'number',
                description: 'Max length of text area input.',
              },
              autoSize: {
                default: false,
                oneOf: [
                  {
                    type: 'boolean',
                    description: 'Auto size the text area height when editing.',
                  },
                  {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      minRows: {
                        type: 'number',
                        description: 'Minimum number of rows for the text area.',
                      },
                      maxRows: {
                        type: 'number',
                        description: 'Maximum number of rows for the text area.',
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
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
          link: 'https://ant.design/components/typography#design-token',
        },
        properties: {
          titleMarginBottom: {
            type: 'string',
            default: '0.5em',
            description: 'Margin bottom for title elements.',
          },
          titleMarginTop: {
            type: 'string',
            default: '1.2em',
            description: 'Margin top for title elements.',
          },
          colorText: {
            type: 'string',
            description: 'Default text color.',
          },
          colorTextSecondary: {
            type: 'string',
            description: 'Text color for secondary type.',
          },
          colorSuccess: {
            type: 'string',
            description: 'Text color for success type.',
          },
          colorWarning: {
            type: 'string',
            description: 'Text color for warning type.',
          },
          colorError: {
            type: 'string',
            description: 'Text color for danger type.',
          },
          colorLink: {
            type: 'string',
            description: 'Color for links within typography.',
          },
          colorLinkHover: {
            type: 'string',
            description: 'Color for links on hover.',
          },
          colorLinkActive: {
            type: 'string',
            description: 'Color for links when active.',
          },
          colorTextDescription: {
            type: 'string',
            description: 'Color for description text.',
          },
          colorTextDisabled: {
            type: 'string',
            description: 'Color for disabled text.',
          },
          fontFamily: {
            type: 'string',
            description: 'Font family for typography text.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Base font size.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Large font size.',
          },
          fontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Small font size.',
          },
          fontWeightStrong: {
            type: 'number',
            default: 600,
            description: 'Font weight for strong text.',
          },
          lineHeight: {
            type: 'number',
            default: 1.5714,
            description: 'Base line height.',
          },
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
      onChange: {
        type: 'array',
        description: 'Trigger action when paragraph is changed.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
