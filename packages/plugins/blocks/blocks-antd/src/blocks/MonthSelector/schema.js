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
        default: true,
        description: 'Allow the user to clear their input.',
      },
      autoFocus: {
        type: 'boolean',
        default: false,
        description: 'Autofocus to the block on page load.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description:
          "Deprecated - use variant: 'borderless'. Whether or not the input has a border style.",
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      variant: {
        type: 'string',
        enum: ['outlined', 'filled', 'borderless'],
        default: 'outlined',
        description: "Variant style of the input. Use 'borderless' instead of bordered: false.",
      },
      disabledDates: {
        type: 'object',
        description: 'Disable specific dates so that they can not be chosen.',
        properties: {
          min: {
            type: ['string', 'object'],
            description:
              'Disable all dates less than the minimum date. Can be a date string or a _date object.',
            docs: {
              displayType: 'date',
            },
          },
          max: {
            type: ['string', 'object'],
            description:
              'Disable all dates greater than the maximum date. Can be a date string or a _date object.',
            docs: {
              displayType: 'date',
            },
          },
          dates: {
            type: 'array',
            description:
              'Array of specific dates to be disabled. Can be date strings or a _date objects.',
            items: {
              type: ['string', 'object'],
              description: 'Specific dates to be disabled.',
              docs: {
                displayType: 'date',
              },
            },
          },
          ranges: {
            type: 'array',
            description:
              'Array of array pairs of start and end dates be disabled. Can be date strings or a _date objects.',
            items: {
              type: 'array',
              description: 'Specific date ranges to be disabled.',
              items: {
                type: ['string', 'object'],
              },
              docs: {
                displayType: 'dateRange',
              },
            },
          },
        },
      },
      format: {
        type: 'string',
        default: 'YYYY-MM',
        description:
          'Format in which to format the date value, eg. "MMMM YYYY" will format a date value of 1999-12-31 as "December 1999". The format has to conform to dayjs formats.',
      },
      placeholder: {
        type: 'string',
        default: 'Select Month',
        description: 'Placeholder text inside the block before user types input.',
      },
      showToday: {
        type: 'boolean',
        default: true,
        description: 'Shows a button to easily select the current date if true.',
      },
      size: {
        type: 'string',
        enum: ['small', 'default', 'large'],
        default: 'default',
        description: 'Size of the block.',
      },
      suffixIcon: {
        type: ['string', 'object'],
        default: 'AiOutlineCalendar',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon on right-hand side of the date picker.",
        docs: {
          displayType: 'icon',
        },
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
        description: 'Month selector label title - supports html.',
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
  cssKeys: ['element', 'label', 'extra', 'feedback', 'popup'],
};

export default schema;
