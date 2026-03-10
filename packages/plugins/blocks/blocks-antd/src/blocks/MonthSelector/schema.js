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
          link: 'https://ant.design/components/date-picker#design-token',
        },
        properties: {
          activeBorderColor: {
            type: 'string',
            description: 'Border color when the picker is active/focused.',
          },
          activeShadow: {
            type: 'string',
            description: 'Shadow effect when the picker is active/focused.',
          },
          hoverBorderColor: {
            type: 'string',
            description: 'Border color when hovering over the picker.',
          },
          cellHeight: {
            type: 'number',
            default: 24,
            description: 'Height of a calendar cell.',
          },
          cellWidth: {
            type: 'number',
            default: 36,
            description: 'Width of a calendar cell.',
          },
          cellHoverBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.04)',
            description: 'Background color of a calendar cell on hover.',
          },
          cellActiveWithRangeBg: {
            type: 'string',
            default: '#e6f4ff',
            description: 'Background color of active cell within a range selection.',
          },
          cellHoverWithRangeBg: {
            type: 'string',
            description: 'Background color of cells within range on hover.',
          },
          cellBgDisabled: {
            type: 'string',
            description: 'Background color of disabled cells.',
          },
          cellRangeBorderColor: {
            type: 'string',
            description: 'Border color of range selection cells.',
          },
          addonBg: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.02)',
            description: 'Background color of the footer addon area.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1050,
            description: 'Z-index of the picker popup layer.',
          },
          paddingBlock: {
            type: 'number',
            default: 4,
            description: 'Vertical padding for the default size picker.',
          },
          paddingBlockSM: {
            type: 'number',
            default: 0,
            description: 'Vertical padding for the small size picker.',
          },
          paddingBlockLG: {
            type: 'number',
            default: 7,
            description: 'Vertical padding for the large size picker.',
          },
          paddingInline: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for the default size picker.',
          },
          paddingInlineSM: {
            type: 'number',
            default: 7,
            description: 'Horizontal padding for the small size picker.',
          },
          paddingInlineLG: {
            type: 'number',
            default: 11,
            description: 'Horizontal padding for the large size picker.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the picker input.',
          },
          borderRadiusSM: {
            type: 'number',
            default: 4,
            description: 'Border radius for the small picker.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for the large picker and popup panel.',
          },
          controlHeight: {
            type: 'number',
            default: 32,
            description: 'Height of the picker input.',
          },
          controlHeightSM: {
            type: 'number',
            default: 24,
            description: 'Height of the small picker input.',
          },
          controlHeightLG: {
            type: 'number',
            default: 40,
            description: 'Height of the large picker input.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the picker input.',
          },
          fontSizeSM: {
            type: 'number',
            default: 14,
            description: 'Font size for the small picker.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size for the large picker.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width of the picker input.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Primary color used for selected month and active states.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the picker input.',
          },
          colorText: {
            type: 'string',
            description: 'Text color of the picker input and calendar cells.',
          },
          colorBorder: {
            type: 'string',
            description: 'Border color of the picker input.',
          },
          colorTextPlaceholder: {
            type: 'string',
            description: 'Color of the placeholder text.',
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
  cssKeys: ['element', 'label', 'extra', 'feedback', 'popup'],
};

export default schema;
