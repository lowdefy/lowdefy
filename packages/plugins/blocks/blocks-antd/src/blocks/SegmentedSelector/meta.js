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
    element: 'The SegmentedSelector element.',
    icon: 'The icon in the SegmentedSelector.',
    label: 'The SegmentedSelector label.',
    extra: 'The SegmentedSelector extra content.',
    feedback: 'The SegmentedSelector validation feedback.',
  },
  events: {
    onChange: 'Trigger actions when selection is changed.',
  },
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
          link: 'https://ant.design/components/segmented#design-token',
        },
        properties: {
          trackBg: {
            type: 'string',
            description: 'Background color of the segmented track container.',
          },
          trackPadding: {
            type: 'number',
            description: 'Padding around the segmented track.',
          },
          itemColor: {
            type: 'string',
            description: 'Default text color for segmented items.',
          },
          itemHoverColor: {
            type: 'string',
            description: 'Text color when hovering over a segmented item.',
          },
          itemHoverBg: {
            type: 'string',
            description: 'Background color when hovering over a segmented item.',
          },
          itemActiveBg: {
            type: 'string',
            description: 'Background color when a segmented item is being pressed.',
          },
          itemSelectedBg: {
            type: 'string',
            description: 'Background color of the selected segmented item.',
          },
          itemSelectedColor: {
            type: 'string',
            description: 'Text color of the selected segmented item.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the segmented control.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large segmented control.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for small segmented control.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the segmented control.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height for large segmented control.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height for small segmented control.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of segmented item text.',
          },
        },
      },
    },
  },
};
